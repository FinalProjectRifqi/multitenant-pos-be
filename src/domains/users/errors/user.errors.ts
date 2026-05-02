import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const userNotFoundError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.UserNotFound,
    message: 'Pengguna tidak ditemukan',
    status: 404,
    details,
  });

export const userUsernameConflictError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.UserUsernameConflict,
    message: 'Username sudah digunakan',
    status: 409,
  });

export const userEmailConflictError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.UserEmailConflict,
    message: 'Email sudah digunakan',
    status: 409,
  });

export const userSelfDeleteError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.UserSelfDelete,
    message: 'Anda tidak dapat menghapus akun Anda sendiri',
    status: 400,
  });

export const userSelfDeactivateError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.UserSelfDeactivate,
    message: 'Anda tidak dapat menonaktifkan akun Anda sendiri',
    status: 400,
  });

export const roleNotFoundError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.RoleNotFound,
    message: 'Role tidak ditemukan',
    status: 404,
  });

export const unitNotFoundForUserError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.UnitNotFound,
    message: 'Unit usaha tidak ditemukan',
    status: 404,
  });
