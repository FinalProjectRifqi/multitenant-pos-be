import { MenuCategory } from '../models/menu-category.model';
import type { Knex } from 'knex';

export interface IMenuCategoryRepository {
  findAll(params: {
    page: number;
    limit: number;
    business_unit_id?: string;
  }): Promise<{ data: MenuCategory[]; total: number }>;
}

export class MenuCategoryRepository implements IMenuCategoryRepository {
  constructor(private readonly db: Knex) {}

  async findAll(params: {
    page: number;
    limit: number;
    business_unit_id?: string;
  }): Promise<{ data: MenuCategory[]; total: number }> {
    const { page, limit, business_unit_id } = params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('menu_categories as mc')
        .whereNull('mc.deleted_at')
        .leftJoin('units as u', 'mc.unit_id', 'u.unit_id');

      if (business_unit_id) {
        query.where('mc.unit_id', business_unit_id);
      }

      return query;
    };

    const [data, countResult] = await Promise.all([
      buildBaseQuery()
        .select(
          'mc.menu_category_id',
          'mc.category_name',
          'mc.description',
          'u.unit_id as business_unit_id',
          'u.unit_name as business_unit_name',
        )
        .orderBy('mc.created_at', 'desc')
        .limit(limit)
        .offset(offset),
      buildBaseQuery()
        .count('mc.menu_category_id as count')
        .first<{ count: string | number }>(),
    ]);

    const total = Number(countResult?.count ?? 0);

    return { data: data as MenuCategory[], total };
  }
}
