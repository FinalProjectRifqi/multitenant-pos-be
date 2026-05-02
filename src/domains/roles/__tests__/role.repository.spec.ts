import type { Knex } from 'knex';
import { RoleRepository } from '../repositories/role.repository';

type MockBuilder = {
  whereNull: jest.Mock;
  where: jest.Mock;
  whereILike: jest.Mock;
  orWhereILike: jest.Mock;
  select: jest.Mock;
  orderBy: jest.Mock;
  limit: jest.Mock;
  offset: jest.Mock;
  count: jest.Mock;
  first: jest.Mock;
  update: jest.Mock;
  returning: jest.Mock;
  insert: jest.Mock;
};

const createBuilder = (): MockBuilder => {
  const builder = {
    whereNull: jest.fn(),
    where: jest.fn(),
    whereILike: jest.fn(),
    orWhereILike: jest.fn(),
    select: jest.fn(),
    orderBy: jest.fn(),
    limit: jest.fn(),
    offset: jest.fn(),
    count: jest.fn(),
    first: jest.fn(),
    update: jest.fn(),
    returning: jest.fn(),
    insert: jest.fn(),
  } as MockBuilder;

  builder.whereNull.mockReturnValue(builder);
  builder.where.mockImplementation((arg1: unknown, _arg2?: unknown) => {
    if (typeof arg1 === 'function') {
      arg1.call(builder);
      return builder;
    }
    return builder;
  });
  builder.whereILike.mockReturnValue(builder);
  builder.orWhereILike.mockReturnValue(builder);
  builder.select.mockReturnValue(builder);
  builder.orderBy.mockReturnValue(builder);
  builder.limit.mockReturnValue(builder);
  builder.count.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);

  return builder;
};

describe('RoleRepository', () => {
  it('findAll returns rows and converts count to number', async () => {
    const rows = [
      {
        role_id: '550e8400-e29b-41d4-a716-446655440000',
        role_name: 'Manajemen Grup',
      },
    ];

    const dataBuilder = createBuilder();
    dataBuilder.offset.mockResolvedValueOnce(rows);

    const countBuilder = createBuilder();
    countBuilder.first.mockResolvedValueOnce({ count: '7' });

    const db = jest
      .fn()
      .mockReturnValueOnce(dataBuilder)
      .mockReturnValueOnce(countBuilder) as unknown as Knex;

    const repository = new RoleRepository(db);

    const result = await repository.findAll({
      page: 2,
      limit: 3,
    });

    expect(result.data).toEqual(rows);
    expect(result.total).toBe(7);
    expect(dataBuilder.limit).toHaveBeenCalledWith(3);
    expect(dataBuilder.offset).toHaveBeenCalledWith(3);
    // expect(dataBuilder.where).toHaveBeenCalledWith('status', 'active');
  });

  it('findAll applies search to name when provided', async () => {
    const dataBuilder = createBuilder();
    dataBuilder.offset.mockResolvedValueOnce([]);

    const countBuilder = createBuilder();
    countBuilder.first.mockResolvedValueOnce({ count: '0' });

    const db = jest
      .fn()
      .mockReturnValueOnce(dataBuilder)
      .mockReturnValueOnce(countBuilder) as unknown as Knex;

    const repository = new RoleRepository(db);

    await repository.findAll({
      page: 1,
      limit: 10,
      search: 'maju',
    });

    expect(dataBuilder.whereILike).toHaveBeenCalledWith('role_name', '%maju%');
  });

  // it('getStats converts aggregate values into numbers', async () => {
  //   const builder = createBuilder();
  //   builder.first.mockResolvedValueOnce({
  //     total_business_unit: '10',
  //     business_unit_active: '8',
  //     business_unit_inactive: '2',
  //   });

  //   const dbFunction = jest.fn().mockReturnValue(builder);
  //   const raw = jest.fn((sql: string) => sql);

  //   const db = Object.assign(dbFunction, { raw }) as unknown as Knex;
  //   const repository = new RoleRepository(db);

  //   const stats = await repository.getStats();

  //   expect(stats).toEqual({
  //     total_business_unit: 10,
  //     business_unit_active: 8,
  //     business_unit_inactive: 2,
  //   });
  // });

  // it('update sends only defined fields and returns updated row', async () => {
  //   const updatedRow = {
  //     unit_id: '550e8400-e29b-41d4-a716-446655440000',
  //     unit_name: 'Nama Baru',
  //     unit_address: 'Alamat Lama',
  //     phone_number: '081234567890',
  //     status: 'active',
  //     created_at: new Date(),
  //     updated_at: new Date(),
  //     deleted_at: null,
  //   };

  //   const builder = createBuilder();
  //   builder.returning.mockResolvedValueOnce([updatedRow]);

  //   const dbFunction = jest.fn().mockReturnValue(builder);
  //   const now = jest.fn(() => new Date('2026-01-01T00:00:00.000Z'));
  //   const db = Object.assign(dbFunction, { fn: { now } }) as unknown as Knex;

  //   const repository = new RoleRepository(db);

  //   const result = await repository.update(updatedRow.role_id, {
  //     role_name: 'Nama Baru',
  //   });

  //   expect(result).toEqual(updatedRow);
  //   expect(builder.update).toHaveBeenCalledWith(
  //     expect.objectContaining({
  //       role_name: 'Nama Baru',
  //     }),
  //   );
  //   expect(builder.update).toHaveBeenCalledWith(
  //     expect.not.objectContaining({
  //       unit_address: expect.anything(),
  //       phone_number: expect.anything(),
  //       status: expect.anything(),
  //     }),
  //   );
  // });
});
