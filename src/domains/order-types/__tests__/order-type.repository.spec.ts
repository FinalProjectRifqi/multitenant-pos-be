// order-type.repository.spec.ts
import type { Knex } from 'knex';
import { OrderTypeRepository } from '../repositories/order-type.repository';
type MockBuilder = {
  whereNull: jest.Mock;
  where: jest.Mock;
  whereILike: jest.Mock;
  orWhereILike: jest.Mock;
  leftJoin: jest.Mock; // ← WAJIB ADA
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
    leftJoin: jest.fn(), // ← WAJIB ADA
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
  builder.leftJoin.mockReturnValue(builder); // ← WAJIB ADA
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

describe('OrderTypeRepository', () => {
  it('findAll returns rows and converts count to number', async () => {
    const rows = [
      {
        order_type_id: '1',
        order_type_name: 'Dine In',
        order_type_code: 'DINE_IN',
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

    const repository = new OrderTypeRepository(db);
    const result = await repository.findAll({ page: 2, limit: 3 });

    expect(result.data).toEqual(rows);
    expect(result.total).toBe(7);
    expect(dataBuilder.limit).toHaveBeenCalledWith(3);
    expect(dataBuilder.offset).toHaveBeenCalledWith(3);
  });

  it('findAll tidak filter unit jika business_unit_id tidak dikirim', async () => {
    const dataBuilder = createBuilder();
    dataBuilder.offset.mockResolvedValueOnce([]);

    const countBuilder = createBuilder();
    countBuilder.first.mockResolvedValueOnce({ count: '0' });

    const db = jest
      .fn()
      .mockReturnValueOnce(dataBuilder)
      .mockReturnValueOnce(countBuilder) as unknown as Knex;

    const repository = new OrderTypeRepository(db);
    await repository.findAll({ page: 1, limit: 10 });

    // where tidak dipanggil dengan unit_id
    expect(dataBuilder.where).not.toHaveBeenCalledWith(
      'mc.unit_id',
      expect.anything(),
    );
  });
});
