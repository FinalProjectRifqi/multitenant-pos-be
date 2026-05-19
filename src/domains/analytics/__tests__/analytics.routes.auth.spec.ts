// analytics.routes.auth.spec.ts
import express from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import 'reflect-metadata';
import request from 'supertest';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import { createErrorHandler } from '../../../common/middlewares/error-handler';
import type { AppConfig } from '../../../config';
import { buildAnalyticsRouter } from '../analytics.routes';

// ===========================
// Mocks
// ===========================

const jwtVerifyMock = jest.fn();

const getKpiMock = jest.fn();
const getSalesTrendMock = jest.fn();
const getTopMenusMock = jest.fn();
const getRecentPaymentsMock = jest.fn();
const getInventoryStatusMock = jest.fn();
const getDailyInventoryMock = jest.fn();

jest.mock('jose', () => {
  class JWTExpired extends Error {}
  return {
    jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
    errors: { JWTExpired },
  };
});

jest.mock('../analytics.controller', () => ({
  AnalyticsController: jest.fn().mockImplementation(() => ({
    getKpi: getKpiMock,
    getSalesTrend: getSalesTrendMock,
    getTopMenus: getTopMenusMock,
    getRecentPayments: getRecentPaymentsMock,
    getInventoryStatus: getInventoryStatusMock,
    getDailyInventory: getDailyInventoryMock,
  })),
}));

// ===========================
// Helpers
// ===========================

const VALID_UNIT_ID = '550e8400-e29b-41d4-a716-446655440000';

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
    '/analytics',
    buildAnalyticsRouter({ knex, config: createConfig(), logger }),
  );
  app.use(createErrorHandler(logger));

  return app;
};

const createValidPayload = (permissions: string[]) => ({
  sub: 'user-1',
  typ: 'Bearer' as const,
  roles: 'staff',
  permission: permissions,
  full_name: 'Test User',
  email: 'test@corp.test',
  units: ['all'],
  must_change_password: false,
});

const successHandler = jest.fn(async (_req: unknown, res: express.Response) =>
  res.status(200).json({ success: true }),
);

// ===========================
// Tests
// ===========================

describe('Analytics routes — auth matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default controller mocks return 200 OK
    getKpiMock.mockImplementation(successHandler);
    getSalesTrendMock.mockImplementation(successHandler);
    getTopMenusMock.mockImplementation(successHandler);
    getRecentPaymentsMock.mockImplementation(successHandler);
    getInventoryStatusMock.mockImplementation(successHandler);
    getDailyInventoryMock.mockImplementation(successHandler);
  });

  // ─── 401 without token ──────────────────────────────────────────────────────

  describe('401 — no Authorization header', () => {
    const routes = [
      { method: 'get', path: `/${VALID_UNIT_ID}/kpi` },
      { method: 'get', path: `/${VALID_UNIT_ID}/sales-trend` },
      { method: 'get', path: `/${VALID_UNIT_ID}/top-menus` },
      { method: 'get', path: `/${VALID_UNIT_ID}/payments` },
      { method: 'get', path: `/${VALID_UNIT_ID}/inventory-status` },
      { method: 'get', path: `/${VALID_UNIT_ID}/daily-inventory` },
    ];

    it.each(routes)('GET /analytics$path returns 401', async ({ path }) => {
      const app = createApp();
      const res = await request(app).get(`/analytics${path}`);

      expect(res.status).toBe(401);
      expect(res.body.error.code).toBe(DomainErrorCodes.AuthTokenMissing);
    });
  });

  // ─── 403 — wrong permission ─────────────────────────────────────────────────

  describe('403 — valid token but missing analytics:read', () => {
    const routes = [
      { path: `/${VALID_UNIT_ID}/kpi` },
      { path: `/${VALID_UNIT_ID}/sales-trend` },
      { path: `/${VALID_UNIT_ID}/top-menus` },
      { path: `/${VALID_UNIT_ID}/payments` },
      { path: `/${VALID_UNIT_ID}/inventory-status` },
      { path: `/${VALID_UNIT_ID}/daily-inventory` },
    ];

    it.each(routes)(
      'GET /analytics$path returns 403 without analytics:read',
      async ({ path }) => {
        jwtVerifyMock.mockResolvedValueOnce({
          payload: createValidPayload(['menu:read']), // wrong permission
        });
        const app = createApp();

        const res = await request(app)
          .get(`/analytics${path}`)
          .set('Authorization', 'Bearer valid-token');

        expect(res.status).toBe(403);
        expect(res.body.error.code).toBe(DomainErrorCodes.AuthForbidden);
      },
    );
  });

  // ─── 403 — empty permissions ─────────────────────────────────────────────────

  describe('403 — valid token with empty permissions', () => {
    it('rejects GET /:unitId/kpi with empty permissions array', async () => {
      jwtVerifyMock.mockResolvedValueOnce({
        payload: createValidPayload([]),
      });
      const app = createApp();

      const res = await request(app)
        .get(`/analytics/${VALID_UNIT_ID}/kpi`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(403);
    });
  });

  // ─── 200 — valid token with analytics:read ──────────────────────────────────

  describe('200 — valid token with analytics:read permission', () => {
    it('GET /:unitId/kpi returns 200', async () => {
      jwtVerifyMock.mockResolvedValueOnce({
        payload: createValidPayload(['analytics:read']),
      });
      const app = createApp();

      const res = await request(app)
        .get(`/analytics/${VALID_UNIT_ID}/kpi?period=7d`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(getKpiMock).toHaveBeenCalledTimes(1);
    });

    it('GET /:unitId/sales-trend returns 200', async () => {
      jwtVerifyMock.mockResolvedValueOnce({
        payload: createValidPayload(['analytics:read']),
      });
      const app = createApp();

      const res = await request(app)
        .get(`/analytics/${VALID_UNIT_ID}/sales-trend?period=30d`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(getSalesTrendMock).toHaveBeenCalledTimes(1);
    });

    it('GET /:unitId/top-menus returns 200', async () => {
      jwtVerifyMock.mockResolvedValueOnce({
        payload: createValidPayload(['analytics:read']),
      });
      const app = createApp();

      const res = await request(app)
        .get(`/analytics/${VALID_UNIT_ID}/top-menus?period=month`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(getTopMenusMock).toHaveBeenCalledTimes(1);
    });

    it('GET /:unitId/payments returns 200', async () => {
      jwtVerifyMock.mockResolvedValueOnce({
        payload: createValidPayload(['analytics:read']),
      });
      const app = createApp();

      const res = await request(app)
        .get(`/analytics/${VALID_UNIT_ID}/payments`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(getRecentPaymentsMock).toHaveBeenCalledTimes(1);
    });

    it('GET /:unitId/inventory-status returns 200', async () => {
      jwtVerifyMock.mockResolvedValueOnce({
        payload: createValidPayload(['analytics:read']),
      });
      const app = createApp();

      const res = await request(app)
        .get(`/analytics/${VALID_UNIT_ID}/inventory-status`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(getInventoryStatusMock).toHaveBeenCalledTimes(1);
    });

    it('GET /:unitId/daily-inventory returns 200', async () => {
      jwtVerifyMock.mockResolvedValueOnce({
        payload: createValidPayload(['analytics:read']),
      });
      const app = createApp();

      const res = await request(app)
        .get(`/analytics/${VALID_UNIT_ID}/daily-inventory?date=2026-05-19`)
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(getDailyInventoryMock).toHaveBeenCalledTimes(1);
    });
  });
});
