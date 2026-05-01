import type { ErrorCode } from './error-codes';
import type { DomainErrorCode } from './error-codes-domain';

export type AppErrorCode = ErrorCode | DomainErrorCode;

interface AppErrorParams {
  code: AppErrorCode;
  message: string;
  status: number;
  details?: unknown;
}

export class AppError extends Error {
  public readonly code: AppErrorCode;
  public readonly status: number;
  public readonly details?: unknown;

  constructor(params: AppErrorParams) {
    super(params.message);
    this.code = params.code;
    this.status = params.status;
    this.details = params.details;
    this.name = 'AppError';
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
