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
