import type { StorageClient } from '@supabase/storage-js';
import type { Logger } from 'pino';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import type { StorageConfig } from '../../config/storage.config';
import type { UpdateFileDto } from './dto/update-file.dto';
import type { UploadFileDto } from './dto/upload-file.dto';
import {
  storageBlobNotFoundError,
  storageDeleteFailedError,
  storageFileTooLargeError,
  storageSignedUrlFailedError,
  storageUploadFailedError,
} from './errors/storage.errors';
import type {
  DeleteFileResult,
  GetFileResult,
  LargeObjectData,
  LargeObjectRow,
  UpdateFileResult,
  UploadFileResult,
} from './models/storage.model';
import type {
  CreateLargeObjectData,
  IStorageRepository,
  UpdateLargeObjectData,
} from './repositories/storage.repository';
import {
  folderPrefixFromStoragePath,
  validateUploadLikePayload,
} from './storage-input.validation';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
  'application/pdf': 'pdf',
  'application/json': 'json',
  'text/plain': 'txt',
  'text/csv': 'csv',
};

export class StorageService {
  constructor(
    private readonly repository: IStorageRepository,
    private readonly storageClient: StorageClient,
    private readonly config: StorageConfig,
    private readonly logger: Logger,
  ) {}

  async uploadFile(dto: UploadFileDto): Promise<UploadFileResult> {
    try {
      const { folder, fileName } = validateUploadLikePayload(dto);

      const maxSizeMB = this.config.maxFileSizeBytes / (1024 * 1024);
      if (dto.sizeBytes > this.config.maxFileSizeBytes) {
        throw storageFileTooLargeError(maxSizeMB);
      }

      const ext = this.extractExtension(fileName, dto.mimeType);
      const storedName = crypto.randomUUID();
      const path = `${folder}/${storedName}.${ext}`;

      await this.checkFolderPrefix(folder);

      try {
        await this.retrySupabaseOperation(
          () =>
            this.storageClient
              .from(this.config.bucketName)
              .upload(path, dto.file, { contentType: dto.mimeType }),
          'upload',
        );
      } catch (err) {
        throw storageUploadFailedError(err);
      }

      this.logger.info(
        { storedName, path, folder },
        'File uploaded to storage',
      );

      const insertData: CreateLargeObjectData = {
        file_name: fileName,
        stored_name: storedName,
        mime: dto.mimeType,
        path,
        size_bytes: dto.sizeBytes,
      };

      let row: LargeObjectRow;
      try {
        row = await this.repository.insert(insertData);
      } catch (dbError) {
        this.logger.error(
          { err: dbError, path },
          'DB insert failed after upload — compensating',
        );
        try {
          await this.retrySupabaseOperation(
            () =>
              this.storageClient
                .from(this.config.bucketName)
                .remove([path]),
            'upload-compensation',
          );
        } catch (compensateError) {
          this.logger.error(
            { err: compensateError, path },
            'Compensation failed — orphan file in storage',
          );
        }
        throw new AppError({
          code: ErrorCodes.Internal,
          message: 'Internal server error',
          status: 500,
        });
      }

      this.logger.info(
        { id_blob: row.id_blob, storedName, path },
        'File uploaded successfully',
      );

      return {
        success: true,
        statusCode: 201,
        message: 'File berhasil diupload',
        data: this.mapToData(row),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error({ err: error }, 'Unexpected error in uploadFile');
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Internal server error',
        status: 500,
      });
    }
  }

  async getFile(idBlob: string): Promise<GetFileResult> {
    try {
      const row = await this.repository.findById(idBlob);

      if (!row || row.deleted_at !== null) {
        throw storageBlobNotFoundError();
      }

      let signedUrl: string;
      try {
        const result = await this.retrySupabaseOperation(
          () =>
            this.storageClient
              .from(this.config.bucketName)
              .createSignedUrl(row.path, this.config.signedUrlTtlSeconds),
          'createSignedUrl',
        );
        signedUrl = result.signedUrl;
      } catch (err) {
        throw storageSignedUrlFailedError(err);
      }

      this.logger.info(
        { id_blob: idBlob, path: row.path },
        'Signed URL generated successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'File berhasil diambil',
        data: { ...this.mapToData(row), signed_url: signedUrl },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error({ err: error }, 'Unexpected error in getFile');
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Internal server error',
        status: 500,
      });
    }
  }

  async updateFile(
    idBlob: string,
    dto: UpdateFileDto,
  ): Promise<UpdateFileResult> {
    try {
      const { folder, fileName } = validateUploadLikePayload(dto);

      const existing = await this.repository.findById(idBlob);

      if (!existing || existing.deleted_at !== null) {
        throw storageBlobNotFoundError();
      }

      const maxSizeMB = this.config.maxFileSizeBytes / (1024 * 1024);
      if (dto.sizeBytes > this.config.maxFileSizeBytes) {
        throw storageFileTooLargeError(maxSizeMB);
      }

      const ext = this.extractExtension(fileName, dto.mimeType);
      const newStoredName = crypto.randomUUID();
      const newPath = `${folder}/${newStoredName}.${ext}`;
      const oldPath = existing.path;

      const oldFolderPrefix = folderPrefixFromStoragePath(existing.path);
      if (folder !== oldFolderPrefix) {
        await this.checkFolderPrefix(folder);
      }

      try {
        await this.retrySupabaseOperation(
          () =>
            this.storageClient
              .from(this.config.bucketName)
              .upload(newPath, dto.file, { contentType: dto.mimeType }),
          'update-upload',
        );
      } catch (err) {
        throw storageUploadFailedError(err);
      }

      this.logger.info(
        { newStoredName, newPath },
        'New file uploaded to storage for update',
      );

      const updateData: UpdateLargeObjectData = {
        file_name: fileName,
        stored_name: newStoredName,
        mime: dto.mimeType,
        path: newPath,
        size_bytes: dto.sizeBytes,
      };

      let updatedRow: LargeObjectRow;
      try {
        updatedRow = await this.repository.updateById(idBlob, updateData);
      } catch (dbError) {
        this.logger.error(
          { err: dbError, newPath },
          'DB update failed — rolling back new upload',
        );
        try {
          await this.retrySupabaseOperation(
            () =>
              this.storageClient
                .from(this.config.bucketName)
                .remove([newPath]),
            'update-rollback',
          );
        } catch (rollbackError) {
          this.logger.error(
            { err: rollbackError, newPath },
            'Rollback failed — orphan new file in storage',
          );
        }
        throw new AppError({
          code: ErrorCodes.Internal,
          message: 'Internal server error',
          status: 500,
        });
      }

      try {
        await this.retrySupabaseOperation(
          () =>
            this.storageClient
              .from(this.config.bucketName)
              .remove([oldPath]),
          'delete-old-file',
        );
      } catch (deleteOldError) {
        this.logger.error(
          { err: deleteOldError, oldPath },
          'Old file deletion failed — orphan file remains in storage',
        );
      }

      this.logger.info(
        { id_blob: idBlob, newStoredName, newPath },
        'File updated successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'File berhasil diupdate',
        data: this.mapToData(updatedRow),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error({ err: error }, 'Unexpected error in updateFile');
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Internal server error',
        status: 500,
      });
    }
  }

  async deleteFile(idBlob: string): Promise<DeleteFileResult> {
    try {
      const row = await this.repository.findById(idBlob);

      if (!row || row.deleted_at !== null) {
        throw storageBlobNotFoundError();
      }

      await this.repository.softDeleteById(idBlob);

      try {
        await this.retrySupabaseOperation(
          () =>
            this.storageClient
              .from(this.config.bucketName)
              .remove([row.path]),
          'delete',
        );
      } catch (supabaseError) {
        this.logger.error(
          { err: supabaseError, id_blob: idBlob },
          'Supabase delete failed — rolling back DB soft delete',
        );
        try {
          await this.repository.undoSoftDeleteById(idBlob);
        } catch (rollbackError) {
          this.logger.error(
            { err: rollbackError, id_blob: idBlob },
            'DB rollback failed — data inconsistent',
          );
        }
        throw storageDeleteFailedError(supabaseError);
      }

      this.logger.info(
        { id_blob: idBlob, path: row.path },
        'File deleted successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'File berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error({ err: error }, 'Unexpected error in deleteFile');
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Internal server error',
        status: 500,
      });
    }
  }

  /**
   * Object storage has no real folders — paths are key prefixes. First write under a prefix
   * implicitly "creates" it. We optionally list the prefix for diagnostics only.
   */
  private async checkFolderPrefix(folderPrefix: string): Promise<void> {
    try {
      const { data, error } = await this.storageClient
        .from(this.config.bucketName)
        .list(folderPrefix);

      if (error) {
        this.logger.warn(
          { err: error, folderPrefix },
          'Could not list storage prefix — proceeding with upload',
        );
        return;
      }

      if (!data || data.length === 0) {
        this.logger.debug(
          { folderPrefix },
          'No objects yet under this prefix; upload will use new object key',
        );
      }
    } catch (err) {
      this.logger.warn(
        { err, folderPrefix },
        'Could not list storage prefix — proceeding with upload',
      );
    }
  }

  /**
   * Wraps a Supabase operation (which returns { data, error }) with exponential backoff retry.
   * Does not retry deterministic client errors (4xx except 408/429) or success with null data when error is set.
   */
  private async retrySupabaseOperation<TData>(
    operation: () => Promise<{ data: TData | null; error: unknown }>,
    operationName: string,
    maxRetries = 3,
    initialDelayMs = 200,
  ): Promise<TData> {
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      try {
        const { data, error } = await operation();

        if (!error && data !== null) {
          return data;
        }

        lastError = error ?? new Error(`${operationName} returned null data`);
      } catch (thrownError) {
        lastError = thrownError;
      }

      if (!this.shouldRetrySupabaseStorageError(lastError)) {
        throw lastError;
      }

      if (attempt <= maxRetries) {
        const delay = initialDelayMs * Math.pow(2, attempt - 1);
        this.logger.warn(
          { attempt, delay, operationName },
          'Retrying Supabase operation',
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError;
  }

  /** Retries only likely-transient failures (5xx, 408, 429, network codes, unknown). */
  private shouldRetrySupabaseStorageError(error: unknown): boolean {
    const status = getSupabaseHttpStatus(error);
    if (status !== undefined) {
      if (status === 408 || status === 429) return true;
      if (status >= 400 && status < 500) return false;
      if (status >= 500) return true;
      return false;
    }

    if (error instanceof Error) {
      const code = (error as NodeJS.ErrnoException).code;
      if (
        code &&
        ['ETIMEDOUT', 'ECONNRESET', 'ECONNREFUSED', 'ENETUNREACH', 'EAI_AGAIN'].includes(
          code,
        )
      ) {
        return true;
      }
    }

    return true;
  }

  private extractExtension(fileName: string, mimeType: string): string {
    const parts = fileName.split('.');
    if (parts.length > 1) {
      const ext = parts[parts.length - 1].toLowerCase();
      if (ext.length >= 1 && ext.length <= 5 && /^[a-z0-9]+$/.test(ext)) {
        return ext;
      }
    }
    return MIME_TO_EXT[mimeType] ?? 'bin';
  }

  private mapToData(row: LargeObjectRow): LargeObjectData {
    return {
      id_blob: row.id_blob,
      file_name: row.file_name,
      stored_name: row.stored_name,
      mime: row.mime,
      path: row.path,
      size_bytes: row.size_bytes,
      uploaded_at: row.uploaded_at,
    };
  }
}

function getSupabaseHttpStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const e = error as Record<string, unknown>;
  if (typeof e.status === 'number') return e.status;
  if (typeof e.statusCode === 'number') return e.statusCode;
  if (typeof e.statusCode === 'string') {
    const n = Number.parseInt(e.statusCode, 10);
    if (!Number.isNaN(n)) return n;
  }
  return undefined;
}
