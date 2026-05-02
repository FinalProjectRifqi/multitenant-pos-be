import type { Knex } from 'knex';
import type { Role } from '../models/role.model';

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
}

interface CreateRoleData {
  role_name: string;
}

interface UpdateRoleData {
  role_name?: string;
}

export interface IRoleRepository {
  findAll(params: FindAllParams): Promise<{ data: Role[]; total: number }>;
  findById(id: string): Promise<Role | null>;
  create(data: CreateRoleData): Promise<Role>;
  update(id: string, data: UpdateRoleData): Promise<Role>;
  softDelete(id: string): Promise<void>;
}

export class RoleRepository implements IRoleRepository {
  constructor(private readonly db: Knex) {}

  async findAll(
    params: FindAllParams,
  ): Promise<{ data: Role[]; total: number }> {
    const { page, limit, search } = params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('roles').whereNull('deleted_at');

      if (search && search.length > 0) {
        query.where(function () {
          this.whereILike('role_name', `%${search}%`);
        });
      }

      return query;
    };

    const [data, countResult] = await Promise.all([
      buildBaseQuery()
        .select('role_id', 'role_name')
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      buildBaseQuery()
        .count('role_id as count')
        .first<{ count: string | number }>(),
    ]);

    const total = Number(countResult?.count ?? 0);

    return { data: data as Role[], total };
  }

  async findById(id: string): Promise<Role | null> {
    const row = await this.db('roles')
      .select('role_id', 'role_name', 'created_at', 'updated_at', 'deleted_at')
      .where('role_id', id)
      .whereNull('deleted_at')
      .first<Role | undefined>();

    return row ?? null;
  }

  async create(data: CreateRoleData): Promise<Role> {
    const [row] = await this.db('roles')
      .insert({
        role_name: data.role_name,
        created_at: this.db.fn.now(),
        updated_at: this.db.fn.now(),
      })
      .returning(['role_id', 'role_name']);

    return row as Role;
  }

  async update(id: string, data: UpdateRoleData): Promise<Role> {
    const updatePayload: Record<string, unknown> = {
      updated_at: this.db.fn.now(),
    };

    if (data.role_name !== undefined) updatePayload.role_name = data.role_name;

    const [row] = await this.db('roles')
      .where('role_id', id)
      .whereNull('deleted_at')
      .update(updatePayload)
      .returning(['role_id', 'role_name']);

    return row as Role;
  }

  async softDelete(id: string): Promise<void> {
    await this.db('roles').where('role_id', id).whereNull('deleted_at').update({
      deleted_at: this.db.fn.now(),
      updated_at: this.db.fn.now(),
    });
  }
}
