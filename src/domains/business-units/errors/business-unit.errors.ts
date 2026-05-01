import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const unitNotFoundError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.UnitNotFound,
    message: 'Unit usaha tidak ditemukan',
    status: 404,
    details,
  });

export const unitInvalidPhoneError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.UnitInvalidPhone,
    message: 'Nomor telepon tidak valid',
    status: 400,
    details,
  });
