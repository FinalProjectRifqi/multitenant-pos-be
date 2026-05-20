import 'reflect-metadata';
import express from 'express';
import request from 'supertest';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../../config';
import { buildUserRouter } from '../user.routes';
import { createErrorHandler } from '../../../common/middlewares/error-handler';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

const jwtVerifyMock = jest.fn();
const listUsersMock = jest.fn();
const getUserStatsMock = jest.fn();
const createUserMock = jest.fn();
const getUserByIdMock = jest.fn();
const updateUserMock = jest.fn();
const deleteUserMock = jest.fn();

jest.mock('jose', () => {
  class JWTExpired extends Error {}
  return {
    jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
    errors: { JWTExpired },
  };
});

jest.mock('../user.controller', () => ({
  UserController: jest.fn().mockImplementation(() => ({
    listUsers: listUsersMock,
    getUserStats: getUserStatsMock,
    createUser: createUserMock,
    getUserById: getUserByIdMock,
    updateUser: updateUserMock,
    deleteUser: deleteUserMock,
  })),
}));

const createConfig = (): AppConfig =>
  ({
    jwt: {
      secret: 'test-secret',
      expiresIn: '1h',
    },
    logger: {
      level: 'silent',
      prettyPrint: false,
    },
  }) as unknown as AppConfig;

const createLogger = (): Logger =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as Logger;

const createApp = () => {
  const app = express();
  app.use(express.json());

  const logger = createLogger();
  const knex = {} as Knex;
  app.use('/users', buildUserRouter({ knex, config: createConfig(), logger }));
  app.use(createErrorHandler(logger));

  return app;
};

const createValidPayload = (permissions: string[]) => ({
  sub: 'user-1',
  typ: 'Bearer' as const,
  roles: 'director',
  permission: permissions,
  full_name: 'Higher Ups',
  email: 'higherups@corp.test',
  units: ['all'],
  must_change_password: false,
});

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

describe('User routes auth matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    listUsersMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
    getUserStatsMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
    createUserMock.mockImplementation(async (_req, res) =>
      res.status(201).json({ success: true }),
    );
    getUserByIdMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
    updateUserMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
    deleteUserMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
  });

  it('rejects GET / without token', async () => {
    const app = createApp();
    const res = await request(app).get('/users');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthTokenMissing);
  });

  it('rejects GET /stats without token', async () => {
    const app = createApp();
    const res = await request(app).get('/users/stats');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthTokenMissing);
  });

  it('rejects GET /:id without token', async () => {
    const app = createApp();
    const res = await request(app).get(`/users/${VALID_UUID}`);
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthTokenMissing);
  });

  it('allows GET / when user has user:read', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['user:read']),
    });
    const app = createApp();

    const res = await request(app)
      .get('/users')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(listUsersMock).toHaveBeenCalledTimes(1);
  });

  it('allows GET / with business_unit_id filter when user has user:read', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['user:read']),
    });
    const app = createApp();

    const res = await request(app)
      .get(`/users?business_unit_id=${VALID_UUID}`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(listUsersMock).toHaveBeenCalledTimes(1);
  });

  it('allows GET / with role_id filter when user has user:read', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['user:read']),
    });
    const app = createApp();

    const res = await request(app)
      .get(`/users?role_id=${VALID_UUID}`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(listUsersMock).toHaveBeenCalledTimes(1);
  });

  it('allows GET /stats when user has user:read', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['user:read']),
    });
    const app = createApp();

    const res = await request(app)
      .get('/users/stats')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(getUserStatsMock).toHaveBeenCalledTimes(1);
  });

  it('rejects GET / when user lacks user:read', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['user:create']),
    });
    const app = createApp();

    const res = await request(app)
      .get('/users')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthForbidden);
  });

  it('rejects POST when user lacks user:create', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['user:read']),
    });
    const app = createApp();

    const res = await request(app)
      .post('/users')
      .set('Authorization', 'Bearer valid-token')
      .send({
        full_name: 'Budi',
        user_name: 'budi',
        email: 'budi@example.com',
        role_id: VALID_UUID,
        business_unit_id: VALID_UUID,
        password: 'password123',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthForbidden);
  });

  it('allows POST when user has user:read, user:create, and unit:assign_user', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload([
        'user:read',
        'user:create',
        'unit:assign_user',
      ]),
    });
    const app = createApp();

    const res = await request(app)
      .post('/users')
      .set('Authorization', 'Bearer valid-token')
      .send({
        full_name: 'Budi Santoso',
        user_name: 'budi.santoso',
        email: 'budi@example.com',
        role_id: VALID_UUID,
        business_unit_id: VALID_UUID,
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(createUserMock).toHaveBeenCalledTimes(1);
  });

  it('rejects PATCH when user lacks user:update', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['user:read', 'unit:assign_user']),
    });
    const app = createApp();

    const res = await request(app)
      .patch(`/users/${VALID_UUID}`)
      .set('Authorization', 'Bearer valid-token')
      .send({ full_name: 'Baru' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthForbidden);
  });

  it('allows PATCH when user has user:read, user:update, and unit:assign_user', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload([
        'user:read',
        'user:update',
        'unit:assign_user',
      ]),
    });
    const app = createApp();

    const res = await request(app)
      .patch(`/users/${VALID_UUID}`)
      .set('Authorization', 'Bearer valid-token')
      .send({ full_name: 'Baru' });

    expect(res.status).toBe(200);
    expect(updateUserMock).toHaveBeenCalledTimes(1);
  });

  it('rejects DELETE when user lacks user:delete', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['user:read']),
    });
    const app = createApp();

    const res = await request(app)
      .delete(`/users/${VALID_UUID}`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthForbidden);
  });

  it('allows DELETE when user has user:read and user:delete', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['user:read', 'user:delete']),
    });
    const app = createApp();

    const res = await request(app)
      .delete(`/users/${VALID_UUID}`)
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(deleteUserMock).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for invalid UUID params before controller runs', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['user:read']),
    });
    const app = createApp();

    const res = await request(app)
      .get('/users/not-a-uuid')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(getUserByIdMock).not.toHaveBeenCalled();
  });
});
