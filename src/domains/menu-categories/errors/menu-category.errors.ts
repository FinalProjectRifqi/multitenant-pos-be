import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const menuCategoryNotFoundError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.MenuCategoryNotFound,
    message: 'Kategori menu tidak ditemukan',
    status: 404,
    details,
  });
