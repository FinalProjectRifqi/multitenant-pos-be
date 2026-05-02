import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const roleNotFoundError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.RoleNotFound,
    message: 'Role tidak ditemukan',
    status: 404,
    details,
  });
