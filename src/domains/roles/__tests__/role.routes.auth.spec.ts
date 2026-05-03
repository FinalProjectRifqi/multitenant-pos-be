import express from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import 'reflect-metadata';
import request from 'supertest';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import { createErrorHandler } from '../../../common/middlewares/error-handler';
import type { AppConfig } from '../../../config';
import { buildRoleRouter } from '../role';

const jwtVerifyMock = jest.fn();
const listRolesMock = jest.fn();

jest.mock('jose', () => {
  class JWTExpired extends Error {}
  return {
    jwtVerify: (...args: unknown[]) => jwtVerifyMock(...args),
    errors: { JWTExpired },
  };
});

jest.mock('../role.controller', () => ({
  RoleController: jest.fn().mockImplementation(() => ({
    listRoles: listRolesMock,
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
  app.use('/roles', buildRoleRouter({ knex, config: createConfig(), logger }));
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

describe('Role routes auth matrix', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    listRolesMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
  });

  it('rejects without token on read endpoint', async () => {
    const app = createApp();

    const res = await request(app).get('/roles');

    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe(DomainErrorCodes.AuthTokenMissing);
  });

  it('allows GET / when user has role:read', async () => {
    jwtVerifyMock.mockResolvedValueOnce({
      payload: createValidPayload(['role:read']),
    });
    const app = createApp();

    const res = await request(app)
      .get('/roles')
      .set('Authorization', 'Bearer valid-token');

    expect(res.status).toBe(200);
    expect(listRolesMock).toHaveBeenCalledTimes(1);
  });
});

// Tambahkan di bawah describe('Role routes auth matrix', ...) yang sudah ada

describe('Role routes — query validation', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Selalu mock JWT valid agar validation error tidak tertutup 401
    jwtVerifyMock.mockResolvedValue({
      payload: createValidPayload(['role:read']),
    });

    listRolesMock.mockImplementation(async (_req, res) =>
      res.status(200).json({ success: true }),
    );
  });

  // ── Happy path ───────────────────────────────────────────────────────

  describe('valid query', () => {
    it('200 — tanpa query params (default page & limit berlaku)', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(listRolesMock).toHaveBeenCalledTimes(1);
    });

    it('200 — page dan limit valid diteruskan ke controller', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=2&limit=25')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(listRolesMock).toHaveBeenCalledTimes(1);
    });

    it('200 — search dikirim bersama page & limit valid', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=1&limit=10&search=admin')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
    });

    it('200 — limit = 1 (batas bawah tepat)', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=1&limit=1')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
    });

    it('200 — limit = 100 (batas atas tepat)', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=1&limit=100')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
    });
  });

  // ── page invalid ─────────────────────────────────────────────────────

  describe('invalid page', () => {
    it('400 — page bukan angka', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=abc&limit=10')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('400 — page = 0', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=0&limit=10')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('400 — page negatif', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=-1&limit=10')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('400 — page float', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=1.5&limit=10')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('400 — page string kosong', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=&limit=10')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });
  });

  // ── limit invalid ────────────────────────────────────────────────────

  describe('invalid limit', () => {
    it('400 — limit bukan angka', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=1&limit=xyz')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('400 — limit = 0', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=1&limit=0')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('400 — limit negatif', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=1&limit=-5')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('400 — limit melebihi 100', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=1&limit=101')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('400 — limit float', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=1&limit=2.5')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });
  });

  // ── multiple errors ──────────────────────────────────────────────────

  describe('multiple invalid fields', () => {
    it('400 — page dan limit invalid sekaligus', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=abc&limit=xyz')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('400 — page=0 dan limit=0 dilaporkan bersamaan', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=0&limit=0')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });
  });

  // ── interaksi auth + validation ──────────────────────────────────────

  describe('auth dan validation bersamaan', () => {
    it('401 diutamakan saat token tidak ada, meskipun query invalid', async () => {
      // Validasi tidak boleh jalan sebelum auth — middleware order harus terjaga
      const app = createApp();
      const res = await request(app).get('/roles?page=abc&limit=xyz');
      // Tidak ada Authorization header

      expect(res.status).toBe(401);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('400 saat token valid tapi query invalid', async () => {
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=0&limit=abc')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(400);
      expect(listRolesMock).not.toHaveBeenCalled();
    });

    it('403 saat token valid tapi permission kurang, query valid', async () => {
      jwtVerifyMock.mockResolvedValueOnce({
        payload: createValidPayload([]), // tidak ada role:read
      });
      const app = createApp();
      const res = await request(app)
        .get('/roles?page=1&limit=10')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(403);
      expect(listRolesMock).not.toHaveBeenCalled();
    });
  });
});
