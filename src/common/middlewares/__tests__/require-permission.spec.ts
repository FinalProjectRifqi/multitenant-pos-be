import type { Request, Response, NextFunction } from 'express';
import type { Logger } from 'pino';
import type { AppConfig } from '../../../config';
import { AppError } from '../../errors/app-error';
import { DomainErrorCodes } from '../../errors/error-codes-domain';
import { buildPermissionMiddleware } from '../require-permission';

const jwtVerifyMock = jest.fn();

jest.mock('jose', () => {
  class JWTExpired extends Error {}

  return {
    jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
    errors: {
      JWTExpired,
    },
  };
});

const createConfig = (): AppConfig =>
  ({
    jwt: {
      secret: 'test-secret-value',
      expiresIn: '1h',
    },
  }) as AppConfig;

const createLogger = (): Logger =>
  ({
    debug: jest.fn(),
    error: jest.fn(),
  }) as unknown as Logger;

const createRequest = (authorization?: string): Request =>
  ({
    headers: {
      authorization,
    },
    id: 'req-1',
  }) as unknown as Request;

const createResponse = (): Response => ({}) as Response;

const getAppError = (next: NextFunction): AppError => {
  const mockedNext = next as unknown as jest.Mock;
  const appError = mockedNext.mock.calls[0][0];

  return appError as AppError;
};

const createValidJwtPayload = (permission: string[] = ['orders:write']) => ({
  sub: 'user-1',
  typ: 'Bearer' as const,
  roles: 'cashier',
  permission,
  full_name: 'John Doe',
  email: 'john@example.com',
  units: ['unit-1'],
  must_change_password: false,
});

describe('buildPermissionMiddleware', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('returns 401 when authorization header is missing', async () => {
    const middleware = buildPermissionMiddleware(
      createConfig(),
      createLogger(),
    )();
    const req = createRequest();
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    const error = getAppError(next);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(DomainErrorCodes.AuthTokenMissing);
    expect(error.status).toBe(401);
  });

  it('returns 401 when token signature is invalid', async () => {
    jwtVerifyMock.mockRejectedValueOnce(new Error('invalid signature'));

    const middleware = buildPermissionMiddleware(
      createConfig(),
      createLogger(),
    )();
    const req = createRequest('Bearer invalid-token');
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    const error = getAppError(next);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(DomainErrorCodes.AuthTokenInvalid);
    expect(error.status).toBe(401);
  });

  it('returns 401 when decoded payload is missing permission claim', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: {
        sub: 'user-1',
        typ: 'Bearer',
        roles: 'admin',
      },
    });

    const middleware = buildPermissionMiddleware(
      createConfig(),
      createLogger(),
    )('order:read');
    const req = createRequest('Bearer valid-token');
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    const error = getAppError(next);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(DomainErrorCodes.AuthTokenInvalid);
    expect(error.status).toBe(401);
  });

  it('returns 403 when required permission is not found', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidJwtPayload(['inventory:read']),
    });

    const middleware = buildPermissionMiddleware(
      createConfig(),
      createLogger(),
    )('orders:write');
    const req = createRequest('Bearer valid-token');
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    const error = getAppError(next);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(DomainErrorCodes.AuthForbidden);
    expect(error.status).toBe(403);
  });

  it('calls next without error and sets req.user for valid token', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidJwtPayload(['orders:write']),
    });

    const middleware = buildPermissionMiddleware(
      createConfig(),
      createLogger(),
    )('orders:write');
    const req = createRequest('Bearer valid-token');
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
    const requestWithUser = req as Request & {
      user?: { sub?: string; permission?: string[] };
    };
    expect(requestWithUser.user?.sub).toBe('user-1');
    expect(requestWithUser.user?.permission).toEqual(['orders:write']);
  });

  it('accepts lowercase bearer scheme in authorization header', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidJwtPayload(['orders:write']),
    });

    const middleware = buildPermissionMiddleware(
      createConfig(),
      createLogger(),
    )('orders:write');
    const req = createRequest('bearer valid-token');
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('returns 401 when authorization scheme is not bearer', async () => {
    const middleware = buildPermissionMiddleware(
      createConfig(),
      createLogger(),
    )();
    const req = createRequest('Basic credential');
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    const error = getAppError(next);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(DomainErrorCodes.AuthTokenInvalid);
    expect(error.status).toBe(401);
  });

  it('returns 401 when authorization header has extra token parts', async () => {
    const middleware = buildPermissionMiddleware(
      createConfig(),
      createLogger(),
    )();
    const req = createRequest('Bearer token extra');
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    const error = getAppError(next);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(DomainErrorCodes.AuthTokenInvalid);
    expect(error.status).toBe(401);
  });

  it('accepts authorization header with excessive whitespace', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidJwtPayload(['orders:write']),
    });

    const middleware = buildPermissionMiddleware(
      createConfig(),
      createLogger(),
    )('orders:write');
    const req = createRequest('   Bearer    valid-token   ');
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  it('returns 401 when token is expired', async () => {
    const joseMock = jest.requireMock('jose') as {
      errors: { JWTExpired: new (message?: string) => Error };
    };
    jwtVerifyMock.mockRejectedValueOnce(
      new joseMock.errors.JWTExpired('expired token'),
    );

    const middleware = buildPermissionMiddleware(
      createConfig(),
      createLogger(),
    )();
    const req = createRequest('Bearer expired-token');
    const res = createResponse();
    const next = jest.fn() as NextFunction;

    await middleware(req, res, next);

    const error = getAppError(next);
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe(DomainErrorCodes.AuthTokenExpired);
    expect(error.status).toBe(401);
  });
});
