import type { RequestHandler } from 'express';
import {
  authForbiddenError,
  authTokenInvalidError,
} from '../../domains/auth/errors/auth.errors';

const normalizeRole = (role: string): string => role.trim().toUpperCase();

export const authorizeRole = (allowedRoles: string[]): RequestHandler => {
  const allowed = new Set(allowedRoles.map(normalizeRole));

  return (req, _res, next) => {
    if (!req.user) {
      return next(authTokenInvalidError());
    }

    if (!allowed.has(normalizeRole(req.user.roles))) {
      return next(
        authForbiddenError({
          allowedRoles,
          currentRole: req.user.roles,
        }),
      );
    }

    next();
  };
};
