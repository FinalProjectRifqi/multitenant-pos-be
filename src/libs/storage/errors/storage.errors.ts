import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const storageBlobNotFoundError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.StorageBlobNotFound,
    message: 'File tidak ditemukan',
    status: 404,
  });

export const storageFileTooLargeError = (maxSizeMB: number): AppError =>
  new AppError({
    code: DomainErrorCodes.StorageFileTooLarge,
    message: `Ukuran file melebihi batas ${maxSizeMB}MB`,
    status: 400,
  });

export const storageUploadFailedError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.StorageUploadFailed,
    message: 'Upload file gagal',
    status: 503,
    details,
  });

export const storageDeleteFailedError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.StorageDeleteFailed,
    message: 'Hapus file gagal',
    status: 500,
    details,
  });

export const storageUpdateFailedError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.StorageUpdateFailed,
    message: 'Update file gagal',
    status: 500,
    details,
  });

export const storageSignedUrlFailedError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.StorageSignedUrlFailed,
    message: 'Gagal membuat signed URL',
    status: 503,
    details,
  });
