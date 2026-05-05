import { OrderType } from '../models/order-type.model';
import type { Knex } from 'knex';

export interface IOrderTypeRepository {
  findAll(params: {
    page: number;
    limit: number;
  }): Promise<{ data: OrderType[]; total: number }>;
}

export class OrderTypeRepository implements IOrderTypeRepository {
  constructor(private readonly db: Knex) {}

  async findAll(params: {
    page: number;
    limit: number;
  }): Promise<{ data: OrderType[]; total: number }> {
    const { page, limit } = params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('order_types').whereNull('deleted_at');

      return query;
    };

    const [data, countResult] = await Promise.all([
      buildBaseQuery()
        .select('order_type_id', 'order_type_name', 'order_type_code')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      buildBaseQuery()
        .count('order_type_id as count')
        .first<{ count: string | number }>(),
    ]);

    const total = Number(countResult?.count ?? 0);

    return { data: data as OrderType[], total };
  }
}
