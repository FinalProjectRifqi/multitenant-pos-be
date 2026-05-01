import 'reflect-metadata';
import express from 'express';
import request from 'supertest';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../../config';
import { buildBusinessUnitRouter } from '../business-unit.routes';
import { createErrorHandler } from '../../../common/middlewares/error-handler';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

const jwtVerifyMock = jest.fn();
const listBusinessUnitsMock = jest.fn();
const getBusinessUnitStatsMock = jest.fn();
const createBusinessUnitMock = jest.fn();
const getBusinessUnitByIdMock = jest.fn();
const updateBusinessUnitMock = jest.fn();
const deleteBusinessUnitMock = jest.fn();

jest.mock('jose', () => {
  class JWTExpired extends Error {}
  return {
    jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
    errors: { JWTExpired },
  };
});

jest.mock('../business-unit.controller', () => ({
  BusinessUnitController: jest.fn().mockImplementation(() => ({
    listBusinessUnits: listBusinessUnitsMock,
    getBusinessUnitStats: getBusinessUnitStatsMock,
    createBusinessUnit: createBusinessUnitMock,
    getBusinessUnitById: getBusinessUnitByIdMock,
    updateBusinessUnit: updateBusinessUnitMock,
    deleteBusinessUnit: deleteBusinessUnitMock,
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
  app.use(
    '/business-units',
    buildBusinessUnitRouter({ knex, config: createConfig(), logger }),
  );
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

describe('BusinessUnit routes auth matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    listBusinessUnitsMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
    getBusinessUnitStatsMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
    createBusinessUnitMock.mockImplementation(async (_req, res) =>
      res.status(201).json({ success: true }),
    );
    getBusinessUnitByIdMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
    updateBusinessUnitMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
    deleteBusinessUnitMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
  });

  it('rejects without token on read endpoint', async () => {
    const app = createApp();

    const res = await request(app).get('/business-units');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthTokenMissing);
  });

  it('allows GET / when user has unit:read', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['unit:read']),
    });
    const app = createApp();

    const res = await request(app)
      .get('/business-units')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(listBusinessUnitsMock).toHaveBeenCalledTimes(1);
  });

  it('allows GET /stats when user has unit:read only', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['unit:read']),
    });
    const app = createApp();

    const res = await request(app)
      .get('/business-units/stats')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(getBusinessUnitStatsMock).toHaveBeenCalledTimes(1);
  });

  it('rejects POST when user has only unit:create without unit:read', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['unit:create']),
    });
    const app = createApp();

    const res = await request(app)
      .post('/business-units')
      .set('Authorization', 'Bearer valid-token')
      .send({
        business_unit_name: 'Toko A',
        business_unit_address: 'Jakarta',
      });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthForbidden);
  });

  it('allows POST when user has unit:read and unit:create', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['unit:read', 'unit:create']),
    });
    const app = createApp();

    const res = await request(app)
      .post('/business-units')
      .set('Authorization', 'Bearer valid-token')
      .send({
        business_unit_name: 'Toko A',
        business_unit_address: 'Jakarta',
      });

    expect(res.status).toBe(201);
    expect(createBusinessUnitMock).toHaveBeenCalledTimes(1);
  });

  it('rejects PATCH when missing action permission even with unit:read', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['unit:read']),
    });
    const app = createApp();

    const res = await request(app)
      .patch('/business-units/550e8400-e29b-41d4-a716-446655440000')
      .set('Authorization', 'Bearer valid-token')
      .send({ business_unit_name: 'Baru' });

    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthForbidden);
  });

  it('allows PATCH when user has unit:read and unit:update', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['unit:read', 'unit:update']),
    });
    const app = createApp();

    const res = await request(app)
      .patch('/business-units/550e8400-e29b-41d4-a716-446655440000')
      .set('Authorization', 'Bearer valid-token')
      .send({ business_unit_name: 'Baru' });

    expect(res.status).toBe(200);
    expect(updateBusinessUnitMock).toHaveBeenCalledTimes(1);
  });

  it('allows DELETE when user has unit:read and unit:delete', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['unit:read', 'unit:delete']),
    });
    const app = createApp();

    const res = await request(app)
      .delete('/business-units/550e8400-e29b-41d4-a716-446655440000')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(deleteBusinessUnitMock).toHaveBeenCalledTimes(1);
  });

  it('returns 400 for invalid UUID params before controller runs', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['unit:read']),
    });
    const app = createApp();

    const res = await request(app)
      .get('/business-units/not-a-uuid')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('VALIDATION_FAILED');
    expect(getBusinessUnitByIdMock).not.toHaveBeenCalled();
  });
});
