import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const authInvalidCredentialsError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.AuthInvalidCredentials,
    message: 'Username atau password salah',
    status: 401,
    details,
  });

export const authInactiveAccountError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.AuthInactiveAccount,
    message: 'Akun Anda tidak aktif. Hubungi administrator.',
    status: 403,
    details,
  });

export const authInvalidRoleError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.AuthInvalidRole,
    message: 'Akun Anda tidak memiliki role yang valid. Hubungi administrator.',
    status: 403,
    details,
  });

export const authTokenMissingError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.AuthTokenMissing,
    message: 'Token autentikasi tidak ditemukan',
    status: 401,
    details,
  });

export const authTokenExpiredError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.AuthTokenExpired,
    message: 'Token autentikasi telah kadaluarsa. Silakan login kembali.',
    status: 401,
    details,
  });

export const authTokenInvalidError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.AuthTokenInvalid,
    message: 'Token autentikasi tidak valid',
    status: 401,
    details,
  });

export const authForbiddenError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.AuthForbidden,
    message: 'Anda tidak memiliki akses ke resource ini',
    status: 403,
    details,
  });
