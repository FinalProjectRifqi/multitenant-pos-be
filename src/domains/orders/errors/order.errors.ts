import { AppError } from '../../../common/errors/app-error';
import { ErrorCodes } from '../../../common/errors/error-codes';

export const orderNotFoundError = (details?: unknown): AppError =>
  new AppError({
    code: ErrorCodes.NotFound,
    message: 'Order not found',
    status: 404,
    details,
  });
