import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const orderTypeNotFoundError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderTypeNotFound,
    message: 'Jenis pesanan tidak ditemukan',
    status: 404,
    details,
  });
