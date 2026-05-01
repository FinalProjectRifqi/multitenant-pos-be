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

export const buildPermissionMiddleware = (
  config: AppConfig,
  logger: Logger,
): RequirePermissionFactory => {
  const encodedSecret = new TextEncoder().encode(config.jwt.secret);

  return (requiredPermission?: string): RequestHandler =>
    async (req, _res, next) => {
      try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
          throw authTokenMissingError();
        }

        if (!authHeader.startsWith('Bearer ')) {
          throw authTokenInvalidError();
        }

        const rawToken = authHeader.split(' ')[1];

        if (!rawToken) {
          throw authTokenInvalidError();
        }

        let payload: JwtTokenPayload;

        try {
          const { payload: decoded } = await jwtVerify(rawToken, encodedSecret);
          payload = decoded as unknown as JwtTokenPayload;
        } catch (joseError) {
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
