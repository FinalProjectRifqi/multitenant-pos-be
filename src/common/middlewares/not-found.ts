import type { RequestHandler } from 'express';
import { ErrorCodes } from '../errors/error-codes';

export const notFoundHandler = (): RequestHandler => (_req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: ErrorCodes.NotFound,
      message: 'Route not found',
    },
  });
};
