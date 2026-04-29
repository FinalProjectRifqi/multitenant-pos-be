import type { ErrorRequestHandler } from 'express';
import type { Logger } from 'pino';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';

const normalizeError = (error: unknown): AppError => {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof SyntaxError) {
    return new AppError({
      code: ErrorCodes.ValidationFailed,
      message: 'Invalid JSON body',
      status: 400,
    });
  }

  return new AppError({
    code: ErrorCodes.Internal,
    message: 'Internal server error',
    status: 500,
  });
};

export const createErrorHandler =
  (logger: Logger): ErrorRequestHandler =>
  (error, req, res, _next) => {
    const appError = normalizeError(error);
    const logPayload = { err: error, requestId: req.id };

    if (appError.status >= 500) {
      logger.error(logPayload, appError.message);
    } else {
      logger.warn(logPayload, appError.message);
    }

    res.status(appError.status).json({
      success: false,
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      },
    });
  };
