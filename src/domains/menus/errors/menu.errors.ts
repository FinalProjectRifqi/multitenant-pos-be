import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const menuNotFoundError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.MenuNotFound,
    message: 'Menu tidak ditemukan',
    status: 404,
  });

export const menuConflictError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.MenuConflict,
    message: 'Nama menu sudah digunakan di unit usaha ini',
    status: 409,
  });

export const menuCategoryNotFoundError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.MenuCategoryNotFound,
    message: 'Kategori menu tidak ditemukan atau tidak milik unit usaha ini',
    status: 404,
  });

export const menuInvalidImageTypeError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.MenuInvalidImageType,
    message: 'Tipe file gambar tidak valid. Hanya file gambar yang diizinkan (image/*)',
    status: 400,
  });
