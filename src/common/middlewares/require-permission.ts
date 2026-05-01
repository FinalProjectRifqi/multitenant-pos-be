import { jwtVerify, errors as JoseErrors } from 'jose';
import type { Request, RequestHandler } from 'express';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import type { JwtTokenPayload } from '../../domains/auth/models/auth.model';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';
import {
  authForbiddenError,
  authTokenExpiredError,
  authTokenInvalidError,
  authTokenMissingError,
} from '../../domains/auth/errors/auth.errors';

export type RequirePermissionFactory = (
  requiredPermission?: string,
) => RequestHandler;

const extractBearerToken = (authorizationHeader?: string): string => {
  if (!authorizationHeader) {
    throw authTokenMissingError();
  }

  if (!authorizationHeader.startsWith('Bearer ')) {
    throw authTokenInvalidError();
  }

  const token = authorizationHeader.slice('Bearer '.length).trim();

  if (!token) {
    throw authTokenInvalidError();
  }

  return token;
};

const isJwtTokenPayload = (
  decodedPayload: unknown,
): decodedPayload is JwtTokenPayload => {
  if (!decodedPayload || typeof decodedPayload !== 'object') {
    return false;
  }

  const payload = decodedPayload as Partial<JwtTokenPayload>;

  return (
    typeof payload.sub === 'string' &&
    payload.sub.length > 0 &&
    Array.isArray(payload.permission) &&
    payload.permission.every((permission) => typeof permission === 'string')
  );
};

export const buildPermissionMiddleware = (
  config: AppConfig,
  logger: Logger,
): RequirePermissionFactory => {
  const encodedSecret = new TextEncoder().encode(config.jwt.secret);

  return (requiredPermission?: string): RequestHandler =>
    async (req, _res, next) => {
      try {
        const rawToken = extractBearerToken(req.headers.authorization);

        let payload: JwtTokenPayload;

        try {
          const { payload: decoded } = await jwtVerify(rawToken, encodedSecret);

          if (!isJwtTokenPayload(decoded)) {
            throw authTokenInvalidError();
          }

          payload = decoded;
        } catch (joseError) {
          if (joseError instanceof AppError) {
            throw joseError;
          }
          if (joseError instanceof JoseErrors.JWTExpired) {
            throw authTokenExpiredError();
          }
          throw authTokenInvalidError();
        }

        const requestWithUser = req as Request & { user?: JwtTokenPayload };
        requestWithUser.user = payload;

        if (requiredPermission !== undefined) {
          const permissionSet = new Set(payload.permission);

          if (!permissionSet.has(requiredPermission)) {
            throw authForbiddenError();
          }
        }

        logger.debug(
          { userId: payload.sub, permission: requiredPermission ?? 'none' },
          'Permission check passed',
        );

        next();
      } catch (error) {
        if (error instanceof AppError) {
          return next(error);
        }

        logger.error(
          { err: error, requestId: req.id },
          'Unexpected error in permission middleware',
        );

        next(
          new AppError({
            code: ErrorCodes.Internal,
            message: 'Terjadi kesalahan internal',
            status: 500,
          }),
        );
      }
    };
};
