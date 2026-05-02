import type { Knex } from 'knex';
import { UserRepository } from '../repositories/user.repository';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';

type MockBuilder = {
  leftJoin: jest.Mock;
  join: jest.Mock;
  whereNull: jest.Mock;
  whereNot: jest.Mock;
  whereRaw: jest.Mock;
  whereIn: jest.Mock;
  where: jest.Mock;
  whereILike: jest.Mock;
  orWhereILike: jest.Mock;
  select: jest.Mock;
  orderByRaw: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  count: jest.Mock;
  first: jest.Mock;
  update: jest.Mock;
  returning: jest.Mock;
  insert: jest.Mock;
  raw: jest.Mock;
};

const createBuilder = (): MockBuilder => {
  const builder = {
    leftJoin: jest.fn(),
    join: jest.fn(),
    whereNull: jest.fn(),
    whereNot: jest.fn(),
    whereRaw: jest.fn(),
    whereIn: jest.fn(),
    where: jest.fn(),
    whereILike: jest.fn(),
    orWhereILike: jest.fn(),
    select: jest.fn(),
    orderByRaw: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    count: jest.fn(),
    first: jest.fn(),
    update: jest.fn(),
    returning: jest.fn(),
    insert: jest.fn(),
    raw: jest.fn(),
  } as MockBuilder;

  builder.leftJoin.mockReturnValue(builder);
  builder.join.mockReturnValue(builder);
  builder.whereNull.mockReturnValue(builder);
  builder.whereNot.mockReturnValue(builder);
  builder.whereRaw.mockReturnValue(builder);
  builder.whereIn.mockReturnValue(builder);
  builder.where.mockImplementation((arg1: unknown) => {
    if (typeof arg1 === 'function') {
      arg1.call(builder);
    }
    return builder;
  });
  builder.whereILike.mockReturnValue(builder);
  builder.orWhereILike.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.orderByRaw.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.count.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.returning.mockReturnValue(builder);

  return builder;
};

describe('UserRepository', () => {
  describe('findAll', () => {
    it('returns merged rows with business units and converts count to number', async () => {
      const userRows = [
        {
          user_id: VALID_UUID,
          full_name: 'Budi Santoso',
          username: 'budi.santoso',
          email: 'budi@example.com',
          is_active: true,
          last_login_at: new Date(),
          role_id: VALID_UUID_2,
          role_name: 'Kasir',
        },
      ];

      const unitRows = [
        {
          user_id: VALID_UUID,
          business_unit_id: VALID_UUID,
          business_unit_name: 'Toko A',
        },
      ];

      const dataBuilder = createBuilder();
      dataBuilder.offset.mockResolvedValueOnce(userRows);

      const countBuilder = createBuilder();
      countBuilder.first.mockResolvedValueOnce({ count: '5' });

      const unitBuilder = createBuilder();
      unitBuilder.select.mockResolvedValueOnce(unitRows);

      let callCount = 0;
      const db = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return dataBuilder;
        if (callCount === 2) return countBuilder;
        return unitBuilder;
      }) as unknown as Knex;

      (db as unknown as { fn: { now: jest.Mock }; raw: jest.Mock }).fn = {
        now: jest.fn().mockReturnValue('NOW()'),
      };
      (db as unknown as { raw: jest.Mock }).raw = jest.fn();

      const repository = new UserRepository(db);
      const result = await repository.findAll({
        page: 1,
        limit: 10,
        sortBy: 'full_name',
        sortType: 'ASC',
      });

      expect(result.total).toBe(5);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].business_units).toHaveLength(1);
      expect(result.data[0].business_units[0].business_unit_name).toBe('Toko A');
    });

    it('returns empty data and skips unit query when no users found', async () => {
      const dataBuilder = createBuilder();
      dataBuilder.offset.mockResolvedValueOnce([]);

      const countBuilder = createBuilder();
      countBuilder.first.mockResolvedValueOnce({ count: '0' });

      let callCount = 0;
      const db = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return dataBuilder;
        return countBuilder;
      }) as unknown as Knex;

      (db as unknown as { fn: { now: jest.Mock }; raw: jest.Mock }).fn = {
        now: jest.fn(),
      };
      (db as unknown as { raw: jest.Mock }).raw = jest.fn();

      const repository = new UserRepository(db);
      const result = await repository.findAll({
        page: 1,
        limit: 10,
        sortBy: 'full_name',
        sortType: 'ASC',
      });

      expect(result.data).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(callCount).toBe(2);
    });
  });

  describe('findById', () => {
    it('returns UserWithDetails when user exists', async () => {
      const userRow = {
        user_id: VALID_UUID,
        full_name: 'Budi',
        username: 'budi',
        email: 'budi@example.com',
        is_active: true,
        last_login_at: new Date(),
        role_id: VALID_UUID_2,
        role_name: 'Kasir',
      };

      const unitRows = [
        { business_unit_id: VALID_UUID, business_unit_name: 'Toko A' },
      ];

      const userBuilder = createBuilder();
      userBuilder.first.mockResolvedValueOnce(userRow);

      const unitBuilder = createBuilder();
      unitBuilder.select.mockResolvedValueOnce(unitRows);

      let callCount = 0;
      const db = jest.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return userBuilder;
        return unitBuilder;
      }) as unknown as Knex;

      const repository = new UserRepository(db);
      const result = await repository.findById(VALID_UUID);

      expect(result).not.toBeNull();
      expect(result?.user_id).toBe(VALID_UUID);
      expect(result?.business_units).toHaveLength(1);
    });

    it('returns null when user does not exist', async () => {
      const userBuilder = createBuilder();
      userBuilder.first.mockResolvedValueOnce(undefined);

      const db = jest.fn().mockReturnValue(userBuilder) as unknown as Knex;

      const repository = new UserRepository(db);
      const result = await repository.findById(VALID_UUID);

      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('parses raw string counts to numbers', async () => {
      const builder = createBuilder();
      builder.first.mockResolvedValueOnce({
        total_users: '30',
        users_active: '25',
        users_inactive: '5',
      });

      const db = jest.fn().mockReturnValue(builder) as unknown as Knex;
      (db as unknown as { raw: jest.Mock }).raw = jest.fn((sql: string) => sql);

      const repository = new UserRepository(db);
      const result = await repository.getStats();

      expect(result.total_users).toBe(30);
      expect(result.users_active).toBe(25);
      expect(result.users_inactive).toBe(5);
    });

    it('returns 0 for all counts when query returns undefined', async () => {
      const builder = createBuilder();
      builder.first.mockResolvedValueOnce(undefined);

      const db = jest.fn().mockReturnValue(builder) as unknown as Knex;
      (db as unknown as { raw: jest.Mock }).raw = jest.fn((sql: string) => sql);

      const repository = new UserRepository(db);
      const result = await repository.getStats();

      expect(result.total_users).toBe(0);
      expect(result.users_active).toBe(0);
      expect(result.users_inactive).toBe(0);
    });
  });

  describe('create', () => {
    it('returns user_id and username from insert', async () => {
      const builder = createBuilder();
      builder.returning.mockResolvedValueOnce([
        { user_id: VALID_UUID, username: 'budi.santoso' },
      ]);

      const db = jest.fn().mockReturnValue(builder) as unknown as Knex;
      (db as unknown as { fn: { now: jest.Mock } }).fn = {
        now: jest.fn().mockReturnValue('NOW()'),
      };

      const repository = new UserRepository(db);
      const result = await repository.create({
        role_id: VALID_UUID_2,
        full_name: 'Budi Santoso',
        username: 'budi.santoso',
        email: 'budi@example.com',
        password: 'hashed',
        is_active: true,
        must_change_password: true,
      });

      expect(result.user_id).toBe(VALID_UUID);
      expect(result.username).toBe('budi.santoso');
    });
  });

  describe('softDelete', () => {
    it('updates deleted_at and updated_at for the given user_id', async () => {
      const builder = createBuilder();
      builder.update.mockResolvedValueOnce(1);

      const db = jest.fn().mockReturnValue(builder) as unknown as Knex;
      (db as unknown as { fn: { now: jest.Mock } }).fn = {
        now: jest.fn().mockReturnValue('NOW()'),
      };

      const repository = new UserRepository(db);
      await repository.softDelete(VALID_UUID);

      expect(builder.where).toHaveBeenCalledWith('user_id', VALID_UUID);
      expect(builder.whereNull).toHaveBeenCalledWith('deleted_at');
      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: 'NOW()' }),
      );
    });
  });

  describe('revokeUserUnits', () => {
    it('sets deleted_at and revoked_at for all active user_units', async () => {
      const builder = createBuilder();
      builder.update.mockResolvedValueOnce(1);

      const db = jest.fn().mockReturnValue(builder) as unknown as Knex;
      (db as unknown as { fn: { now: jest.Mock } }).fn = {
        now: jest.fn().mockReturnValue('NOW()'),
      };

      const repository = new UserRepository(db);
      await repository.revokeUserUnits(VALID_UUID);

      expect(builder.where).toHaveBeenCalledWith('user_id', VALID_UUID);
      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({
          deleted_at: 'NOW()',
          revoked_at: 'NOW()',
        }),
      );
    });
  });
});
