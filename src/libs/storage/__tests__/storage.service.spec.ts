import { StorageApiError, type StorageClient } from '@supabase/storage-js';
import type { Logger } from 'pino';
import { AppError } from '../../../common/errors/app-error';
import { ErrorCodes } from '../../../common/errors/error-codes';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import type { StorageConfig } from '../../../config/storage.config';
import type { UpdateFileDto } from '../dto/update-file.dto';
import type { UploadFileDto } from '../dto/upload-file.dto';
import type { LargeObjectRow } from '../models/storage.model';
import type { IStorageRepository } from '../repositories/storage.repository';
import { StorageService } from '../storage.service';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const JPEG_BUFFER = Buffer.from('fake-jpeg-content');
const PNG_BUFFER = Buffer.from('fake-png-content');

const createMockConfig = (): StorageConfig => ({
  url: 'https://test.supabase.co',
  secretKey: 'test-secret',
  bucketName: 'uploads',
  maxFileSizeBytes: 5 * 1024 * 1024,
  signedUrlTtlSeconds: 21600,
});

const createMockLogger = () =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<Logger>;

const createMockRepository = (): jest.Mocked<IStorageRepository> => ({
  insert: jest.fn(),
  findById: jest.fn(),
  updateById: jest.fn(),
  softDeleteById: jest.fn(),
  undoSoftDeleteById: jest.fn(),
});

type MockBucket = {
  upload: jest.Mock;
  remove: jest.Mock;
  createSignedUrl: jest.Mock;
  list: jest.Mock;
};

const createMockBucket = (): MockBucket => ({
  upload: jest.fn(),
  remove: jest.fn(),
  createSignedUrl: jest.fn(),
  list: jest.fn(),
});

const createLargeObjectRow = (
  overrides?: Partial<LargeObjectRow>,
): LargeObjectRow => ({
  id_blob: VALID_UUID,
  file_name: 'photo.jpg',
  stored_name: VALID_UUID,
  mime: 'image/jpeg',
  path: `products/${VALID_UUID}.jpg`,
  size_bytes: JPEG_BUFFER.length,
  uploaded_at: new Date('2026-01-01T00:00:00.000Z'),
  deleted_at: null,
  ...overrides,
});

const validUploadDto: UploadFileDto = {
  file: JPEG_BUFFER,
  fileName: 'photo.jpg',
  mimeType: 'image/jpeg',
  sizeBytes: JPEG_BUFFER.length,
  folder: 'products',
};

const validUpdateDto: UpdateFileDto = {
  file: PNG_BUFFER,
  fileName: 'photo-updated.png',
  mimeType: 'image/png',
  sizeBytes: PNG_BUFFER.length,
  folder: 'products',
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe('StorageService', () => {
  let service: StorageService;
  let mockRepository: jest.Mocked<IStorageRepository>;
  let mockBucket: MockBucket;
  let mockConfig: StorageConfig;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    jest.useFakeTimers();
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();
    mockBucket = createMockBucket();
    const mockStorageClient = {
      from: jest.fn().mockReturnValue(mockBucket),
    };
    service = new StorageService(
      mockRepository,
      mockStorageClient as unknown as StorageClient,
      mockConfig,
      mockLogger,
    );
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // uploadFile
  // ---------------------------------------------------------------------------

  describe('uploadFile', () => {
    it('uploads file and returns 201 with data', async () => {
      const row = createLargeObjectRow();
      mockBucket.list.mockResolvedValue({
        data: ['existing-file'],
        error: null,
      });
      mockBucket.upload.mockResolvedValue({
        data: { id: 'x', path: row.path, fullPath: row.path },
        error: null,
      });
      mockRepository.insert.mockResolvedValue(row);

      const result = await service.uploadFile(validUploadDto);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data.id_blob).toBe(VALID_UUID);
      expect(result.data.mime).toBe('image/jpeg');
      expect(mockRepository.insert).toHaveBeenCalledTimes(1);
    });

    it('logs DEBUG when prefix has no objects yet', async () => {
      const row = createLargeObjectRow();
      mockBucket.list.mockResolvedValue({ data: [], error: null });
      mockBucket.upload.mockResolvedValue({
        data: { id: 'x', path: row.path, fullPath: row.path },
        error: null,
      });
      mockRepository.insert.mockResolvedValue(row);

      await service.uploadFile(validUploadDto);

      expect(mockLogger.debug).toHaveBeenCalledWith(
        expect.objectContaining({ folderPrefix: 'products' }),
        expect.stringContaining('No objects yet under this prefix'),
      );
    });

    it('throws storageFileTooLargeError when file exceeds max size', async () => {
      const oversized = Buffer.alloc(mockConfig.maxFileSizeBytes + 1, 0);
      const dto: UploadFileDto = {
        ...validUploadDto,
        file: oversized,
        sizeBytes: oversized.length,
      };

      await expect(service.uploadFile(dto)).rejects.toMatchObject({
        code: DomainErrorCodes.StorageFileTooLarge,
        status: 400,
      });
      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('throws storageInvalidInput when sizeBytes does not match buffer length', async () => {
      await expect(
        service.uploadFile({
          ...validUploadDto,
          sizeBytes: validUploadDto.sizeBytes + 1,
        }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.StorageInvalidInput,
        status: 400,
      });
      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('throws storageInvalidInput for unsafe folder', async () => {
      await expect(
        service.uploadFile({
          ...validUploadDto,
          folder: '../other-tenant',
        }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.StorageInvalidInput,
        status: 400,
      });
      expect(mockBucket.upload).not.toHaveBeenCalled();
    });

    it('does not retry when Supabase returns 403', async () => {
      mockBucket.list.mockResolvedValue({ data: [], error: null });
      mockBucket.upload.mockResolvedValue({
        data: null,
        error: new StorageApiError('Forbidden', 403, '403'),
      });

      await expect(service.uploadFile(validUploadDto)).rejects.toMatchObject({
        code: DomainErrorCodes.StorageUploadFailed,
        status: 503,
      });
      expect(mockBucket.upload).toHaveBeenCalledTimes(1);
    });

    it('throws storageUploadFailedError when Supabase upload fails after all retries', async () => {
      mockBucket.list.mockResolvedValue({ data: [], error: null });
      mockBucket.upload.mockResolvedValue({
        data: null,
        error: new Error('network error'),
      });

      const assertion = expect(
        service.uploadFile(validUploadDto),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.StorageUploadFailed,
        status: 503,
      });
      await jest.runAllTimersAsync();
      await assertion;
      expect(mockBucket.upload).toHaveBeenCalledTimes(4);
    });

    it('compensates by deleting file from Supabase when DB insert fails', async () => {
      const row = createLargeObjectRow();
      mockBucket.list.mockResolvedValue({ data: [], error: null });
      mockBucket.upload.mockResolvedValue({
        data: { id: 'x', path: row.path, fullPath: row.path },
        error: null,
      });
      mockBucket.remove.mockResolvedValue({ data: [], error: null });
      mockRepository.insert.mockRejectedValue(new Error('DB error'));

      await expect(service.uploadFile(validUploadDto)).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });

      expect(mockBucket.remove).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.anything() }),
        expect.stringContaining('DB insert failed'),
      );
    });

    it('logs error when compensation itself fails (orphan file)', async () => {
      const row = createLargeObjectRow();
      mockBucket.list.mockResolvedValue({ data: [], error: null });
      mockBucket.upload.mockResolvedValue({
        data: { id: 'x', path: row.path, fullPath: row.path },
        error: null,
      });
      mockBucket.remove.mockResolvedValue({
        data: null,
        error: new Error('delete failed'),
      });
      mockRepository.insert.mockRejectedValue(new Error('DB error'));

      const assertion = expect(
        service.uploadFile(validUploadDto),
      ).rejects.toMatchObject({ status: 500 });
      await jest.runAllTimersAsync();
      await assertion;

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({
          err: expect.anything(),
          path: expect.any(String),
        }),
        expect.stringContaining('Compensation failed'),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getFile
  // ---------------------------------------------------------------------------

  describe('getFile', () => {
    it('returns 200 with signed URL when file exists', async () => {
      const row = createLargeObjectRow();
      mockRepository.findById.mockResolvedValue(row);
      mockBucket.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://signed.url/file.jpg?token=abc' },
        error: null,
      });

      const result = await service.getFile(VALID_UUID);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data.signed_url).toBe(
        'https://signed.url/file.jpg?token=abc',
      );
      expect(result.data.id_blob).toBe(VALID_UUID);
    });

    it('throws storageBlobNotFoundError when file does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.getFile(VALID_UUID)).rejects.toMatchObject({
        code: DomainErrorCodes.StorageBlobNotFound,
        status: 404,
      });
      expect(mockBucket.createSignedUrl).not.toHaveBeenCalled();
    });

    it('throws storageBlobNotFoundError when file is soft-deleted', async () => {
      const row = createLargeObjectRow({
        deleted_at: new Date('2026-01-02T00:00:00.000Z'),
      });
      mockRepository.findById.mockResolvedValue(row);

      await expect(service.getFile(VALID_UUID)).rejects.toMatchObject({
        code: DomainErrorCodes.StorageBlobNotFound,
        status: 404,
      });
    });

    it('throws storageSignedUrlFailedError when signed URL generation fails', async () => {
      const row = createLargeObjectRow();
      mockRepository.findById.mockResolvedValue(row);
      mockBucket.createSignedUrl.mockResolvedValue({
        data: null,
        error: new Error('token generation failed'),
      });

      const assertion = expect(
        service.getFile(VALID_UUID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.StorageSignedUrlFailed,
        status: 503,
      });
      await jest.runAllTimersAsync();
      await assertion;
    });

    it('uses the TTL from config for signed URL', async () => {
      const row = createLargeObjectRow();
      mockRepository.findById.mockResolvedValue(row);
      mockBucket.createSignedUrl.mockResolvedValue({
        data: { signedUrl: 'https://signed.url/file.jpg' },
        error: null,
      });

      await service.getFile(VALID_UUID);

      expect(mockBucket.createSignedUrl).toHaveBeenCalledWith(
        row.path,
        mockConfig.signedUrlTtlSeconds,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // updateFile
  // ---------------------------------------------------------------------------

  describe('updateFile', () => {
    it('updates file and returns 200 with new data', async () => {
      const existingRow = createLargeObjectRow();
      const updatedRow = createLargeObjectRow({
        mime: 'image/png',
        size_bytes: PNG_BUFFER.length,
        file_name: 'photo-updated.png',
      });
      mockRepository.findById.mockResolvedValue(existingRow);
      mockBucket.upload.mockResolvedValue({
        data: { id: 'x', path: updatedRow.path, fullPath: updatedRow.path },
        error: null,
      });
      mockRepository.updateById.mockResolvedValue(updatedRow);
      mockBucket.remove.mockResolvedValue({ data: [], error: null });

      const result = await service.updateFile(VALID_UUID, validUpdateDto);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data.mime).toBe('image/png');
      expect(mockBucket.remove).toHaveBeenCalledTimes(1);
    });

    it('checks new folder when folder changes', async () => {
      const existingRow = createLargeObjectRow({ path: 'old-folder/uuid.jpg' });
      const updatedRow = createLargeObjectRow({ path: 'new-folder/uuid.png' });
      mockRepository.findById.mockResolvedValue(existingRow);
      mockBucket.list.mockResolvedValue({ data: [], error: null });
      mockBucket.upload.mockResolvedValue({
        data: { id: 'x', path: updatedRow.path, fullPath: updatedRow.path },
        error: null,
      });
      mockRepository.updateById.mockResolvedValue(updatedRow);
      mockBucket.remove.mockResolvedValue({ data: [], error: null });

      await service.updateFile(VALID_UUID, {
        ...validUpdateDto,
        folder: 'new-folder',
      });

      expect(mockBucket.list).toHaveBeenCalledWith('new-folder');
    });

    it('throws storageBlobNotFoundError when file does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.updateFile(VALID_UUID, validUpdateDto),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.StorageBlobNotFound,
        status: 404,
      });
    });

    it('throws storageFileTooLargeError when file exceeds max size', async () => {
      const row = createLargeObjectRow();
      mockRepository.findById.mockResolvedValue(row);

      const oversized = Buffer.alloc(mockConfig.maxFileSizeBytes + 1, 0);
      const dto: UpdateFileDto = {
        ...validUpdateDto,
        file: oversized,
        sizeBytes: oversized.length,
      };

      await expect(service.updateFile(VALID_UUID, dto)).rejects.toMatchObject({
        code: DomainErrorCodes.StorageFileTooLarge,
        status: 400,
      });
    });

    it('throws storageUploadFailedError when new file upload fails', async () => {
      const row = createLargeObjectRow();
      mockRepository.findById.mockResolvedValue(row);
      mockBucket.upload.mockResolvedValue({
        data: null,
        error: new Error('upload failed'),
      });

      const assertion = expect(
        service.updateFile(VALID_UUID, validUpdateDto),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.StorageUploadFailed,
        status: 503,
      });
      await jest.runAllTimersAsync();
      await assertion;
    });

    it('rolls back new upload when DB update fails', async () => {
      const row = createLargeObjectRow();
      mockRepository.findById.mockResolvedValue(row);
      mockBucket.upload.mockResolvedValue({
        data: {
          id: 'x',
          path: 'products/new-uuid.png',
          fullPath: 'products/new-uuid.png',
        },
        error: null,
      });
      mockRepository.updateById.mockRejectedValue(new Error('DB error'));
      mockBucket.remove.mockResolvedValue({ data: [], error: null });

      await expect(
        service.updateFile(VALID_UUID, validUpdateDto),
      ).rejects.toMatchObject({
        status: 500,
      });

      expect(mockBucket.remove).toHaveBeenCalledTimes(1);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ err: expect.anything() }),
        expect.stringContaining('DB update failed'),
      );
    });

    it('logs error but returns success when old file deletion fails', async () => {
      const row = createLargeObjectRow();
      const updatedRow = createLargeObjectRow({ mime: 'image/png' });
      mockRepository.findById.mockResolvedValue(row);
      mockBucket.upload.mockResolvedValue({
        data: { id: 'x', path: updatedRow.path, fullPath: updatedRow.path },
        error: null,
      });
      mockRepository.updateById.mockResolvedValue(updatedRow);
      mockBucket.remove.mockResolvedValue({
        data: null,
        error: new Error('delete failed'),
      });

      const promise = service.updateFile(VALID_UUID, validUpdateDto);
      await jest.runAllTimersAsync();
      const result = await promise;

      expect(result.success).toBe(true);
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ oldPath: expect.any(String) }),
        expect.stringContaining('Old file deletion failed'),
      );
    });
  });

  // ---------------------------------------------------------------------------
  // deleteFile
  // ---------------------------------------------------------------------------

  describe('deleteFile', () => {
    it('soft-deletes from DB and hard-deletes from Supabase, returns 200', async () => {
      const row = createLargeObjectRow();
      mockRepository.findById.mockResolvedValue(row);
      mockRepository.softDeleteById.mockResolvedValue(undefined);
      mockBucket.remove.mockResolvedValue({ data: [], error: null });

      const result = await service.deleteFile(VALID_UUID);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(mockRepository.softDeleteById).toHaveBeenCalledWith(VALID_UUID);
      expect(mockBucket.remove).toHaveBeenCalledWith([row.path]);
    });

    it('throws storageBlobNotFoundError when file does not exist', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.deleteFile(VALID_UUID)).rejects.toMatchObject({
        code: DomainErrorCodes.StorageBlobNotFound,
        status: 404,
      });
      expect(mockRepository.softDeleteById).not.toHaveBeenCalled();
    });

    it('throws storageBlobNotFoundError when file is already deleted', async () => {
      const row = createLargeObjectRow({
        deleted_at: new Date('2026-01-02T00:00:00.000Z'),
      });
      mockRepository.findById.mockResolvedValue(row);

      await expect(service.deleteFile(VALID_UUID)).rejects.toMatchObject({
        code: DomainErrorCodes.StorageBlobNotFound,
        status: 404,
      });
    });

    it('throws AppError when DB soft delete fails', async () => {
      const row = createLargeObjectRow();
      mockRepository.findById.mockResolvedValue(row);
      mockRepository.softDeleteById.mockRejectedValue(new Error('DB error'));

      await expect(service.deleteFile(VALID_UUID)).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
      expect(mockBucket.remove).not.toHaveBeenCalled();
    });

    it('rolls back DB soft delete and throws when Supabase delete fails', async () => {
      const row = createLargeObjectRow();
      mockRepository.findById.mockResolvedValue(row);
      mockRepository.softDeleteById.mockResolvedValue(undefined);
      mockBucket.remove.mockResolvedValue({
        data: null,
        error: new Error('supabase error'),
      });
      mockRepository.undoSoftDeleteById.mockResolvedValue(undefined);

      const assertion = expect(
        service.deleteFile(VALID_UUID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.StorageDeleteFailed,
        status: 500,
      });
      await jest.runAllTimersAsync();
      await assertion;

      expect(mockRepository.undoSoftDeleteById).toHaveBeenCalledWith(
        VALID_UUID,
      );
      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ id_blob: VALID_UUID }),
        expect.stringContaining('Supabase delete failed'),
      );
    });

    it('logs error when DB rollback also fails after Supabase delete fails', async () => {
      const row = createLargeObjectRow();
      mockRepository.findById.mockResolvedValue(row);
      mockRepository.softDeleteById.mockResolvedValue(undefined);
      mockBucket.remove.mockResolvedValue({
        data: null,
        error: new Error('supabase error'),
      });
      mockRepository.undoSoftDeleteById.mockRejectedValue(
        new Error('rollback failed'),
      );

      const assertion = expect(
        service.deleteFile(VALID_UUID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.StorageDeleteFailed,
      });
      await jest.runAllTimersAsync();
      await assertion;

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ id_blob: VALID_UUID }),
        expect.stringContaining('DB rollback failed'),
      );
    });
  });
});
