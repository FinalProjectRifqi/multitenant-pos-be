import type { Knex } from 'knex';
import type {
  BusinessUnitRef,
  RawUserStats,
  UserRow,
  UserStats,
  UserWithDetails,
} from '../models/user.model';

export type SortByColumn =
  | 'full_name'
  | 'username'
  | 'business_unit_name'
  | 'role_name'
  | 'status'
  | 'last_login';

export interface FindAllUsersParams {
  page: number;
  limit: number;
  search?: string;
  sortBy: SortByColumn;
  sortType: 'ASC' | 'DESC';
}

export interface CreateUserData {
  role_id: string;
  full_name: string;
  username: string;
  email: string;
  password: string;
  is_active: true;
  must_change_password: true;
}

export interface UpdateUserData {
  full_name?: string;
  username?: string;
  email?: string;
  role_id?: string;
  is_active?: boolean;
}

interface RawBusinessUnitRow {
  user_id: string;
  business_unit_id: string;
  business_unit_name: string;
}

export interface IUserRepository {
  findAll(
    params: FindAllUsersParams,
  ): Promise<{ data: UserWithDetails[]; total: number }>;
  findById(id: string): Promise<UserWithDetails | null>;
  getStats(): Promise<UserStats>;
  findByUsername(
    username: string,
    excludeUserId?: string,
  ): Promise<{ user_id: string } | null>;
  findByEmail(
    email: string,
    excludeUserId?: string,
  ): Promise<{ user_id: string } | null>;
  findRoleById(roleId: string): Promise<{ role_id: string } | null>;
  findUnitById(unitId: string): Promise<{ unit_id: string } | null>;
  findActiveUserUnits(userId: string): Promise<{ unit_id: string }[]>;
  create(data: CreateUserData): Promise<{ user_id: string; username: string }>;
  createUserUnit(userId: string, unitId: string): Promise<void>;
  createWithUnit(
    data: CreateUserData,
    unitId: string,
  ): Promise<{ user_id: string; username: string }>;
  update(id: string, data: UpdateUserData): Promise<void>;
  revokeUserUnits(userId: string): Promise<void>;
  replaceUserUnit(userId: string, unitId: string): Promise<void>;
  softDelete(id: string): Promise<void>;
  softDeleteUserUnits(userId: string): Promise<void>;
}

const SORT_COLUMN_MAP: Record<
  Exclude<SortByColumn, 'business_unit_name'>,
  string
> = {
  full_name: 'u.full_name',
  username: 'u.username',
  role_name: 'r.role_name',
  status: 'u.is_active',
  last_login: 'u.last_login_at',
};

export class UserRepository implements IUserRepository {
  constructor(private readonly db: Knex) {}

  async findAll(
    params: FindAllUsersParams,
  ): Promise<{ data: UserWithDetails[]; total: number }> {
    const { page, limit, search, sortBy, sortType } = params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('users as u')
        .leftJoin('roles as r', function () {
          this.on('r.role_id', '=', 'u.role_id').andOnNull('r.deleted_at');
        })
        .whereNull('u.deleted_at');

      if (search) {
        query.where(function () {
          this.whereILike('u.full_name', `%${search}%`)
            .orWhereILike('u.username', `%${search}%`)
            .orWhereILike('u.email', `%${search}%`)
            .orWhereILike('r.role_name', `%${search}%`);
        });
      }

      return query;
    };

    const dataQuery = buildBaseQuery().select(
      'u.user_id',
      'u.full_name',
      'u.username',
      'u.email',
      'u.is_active',
      'u.last_login_at',
      'r.role_id',
      'r.role_name',
    );

    if (sortBy === 'business_unit_name') {
      dataQuery.orderByRaw(
        `(
          SELECT un2.unit_name
          FROM user_units uu2
          JOIN units un2 ON un2.unit_id = uu2.unit_id AND un2.deleted_at IS NULL
          WHERE uu2.user_id = u.user_id AND uu2.deleted_at IS NULL
          ORDER BY uu2.assigned_at DESC
          LIMIT 1
        ) ${sortType} NULLS LAST`,
      );
    } else {
      const col = SORT_COLUMN_MAP[sortBy];
      dataQuery.orderByRaw(`${col} ${sortType} NULLS LAST`);
    }

    const [rows, countResult] = await Promise.all([
      dataQuery.limit(limit).offset(offset),
      buildBaseQuery()
        .count('u.user_id as count')
        .first<{ count: string | number }>(),
    ]);

    const total = Number(countResult?.count ?? 0);
    const userRows = rows as UserRow[];

    if (userRows.length === 0) {
      return { data: [], total };
    }

    const userIds = userRows.map((u) => u.user_id);
    const unitRows = await this.db('user_units as uu')
      .join('units as un', function () {
        this.on('un.unit_id', '=', 'uu.unit_id').andOnNull('un.deleted_at');
      })
      .whereIn('uu.user_id', userIds)
      .whereNull('uu.deleted_at')
      .select(
        'uu.user_id',
        'un.unit_id as business_unit_id',
        'un.unit_name as business_unit_name',
      );

    const unitsByUserId = new Map<string, BusinessUnitRef[]>();
    for (const row of unitRows as RawBusinessUnitRow[]) {
      const existing = unitsByUserId.get(row.user_id) ?? [];
      existing.push({
        business_unit_id: row.business_unit_id,
        business_unit_name: row.business_unit_name,
      });
      unitsByUserId.set(row.user_id, existing);
    }

    const data: UserWithDetails[] = userRows.map((u) => ({
      ...u,
      business_units: unitsByUserId.get(u.user_id) ?? [],
    }));

    return { data, total };
  }

  async findById(id: string): Promise<UserWithDetails | null> {
    const row = await this.db('users as u')
      .leftJoin('roles as r', function () {
        this.on('r.role_id', '=', 'u.role_id').andOnNull('r.deleted_at');
      })
      .select(
        'u.user_id',
        'u.full_name',
        'u.username',
        'u.email',
        'u.is_active',
        'u.last_login_at',
        'r.role_id',
        'r.role_name',
        'r.role_code',
      )
      .where('u.user_id', id)
      .whereNull('u.deleted_at')
      .first<UserRow | undefined>();

    if (!row) {
      return null;
    }

    const unitRows = await this.db('user_units as uu')
      .join('units as un', function () {
        this.on('un.unit_id', '=', 'uu.unit_id').andOnNull('un.deleted_at');
      })
      .where('uu.user_id', id)
      .whereNull('uu.deleted_at')
      .select(
        'un.unit_id as business_unit_id',
        'un.unit_name as business_unit_name',
      );

    return {
      ...row,
      business_units: unitRows as BusinessUnitRef[],
    };
  }

  async getStats(): Promise<UserStats> {
    const row = await this.db('users')
      .select(
        this.db.raw('COUNT(*) AS total_users'),
        this.db.raw('COUNT(*) FILTER (WHERE is_active = true) AS users_active'),
        this.db.raw(
          'COUNT(*) FILTER (WHERE is_active = false) AS users_inactive',
        ),
      )
      .first<RawUserStats | undefined>();

    return {
      total_users: Number(row?.total_users ?? 0),
      users_active: Number(row?.users_active ?? 0),
      users_inactive: Number(row?.users_inactive ?? 0),
    };
  }

  async findByUsername(
    username: string,
    excludeUserId?: string,
  ): Promise<{ user_id: string } | null> {
    const query = this.db('users')
      .select('user_id')
      .whereRaw('LOWER(username) = LOWER(?)', [username])
      .whereNull('deleted_at');

    if (excludeUserId) {
      query.whereNot('user_id', excludeUserId);
    }

    const row = await query.first<{ user_id: string } | undefined>();
    return row ?? null;
  }

  async findByEmail(
    email: string,
    excludeUserId?: string,
  ): Promise<{ user_id: string } | null> {
    const query = this.db('users')
      .select('user_id')
      .whereRaw('LOWER(email) = LOWER(?)', [email])
      .whereNull('deleted_at');

    if (excludeUserId) {
      query.whereNot('user_id', excludeUserId);
    }

    const row = await query.first<{ user_id: string } | undefined>();
    return row ?? null;
  }

  async findRoleById(roleId: string): Promise<{ role_id: string } | null> {
    const row = await this.db('roles')
      .select('role_id')
      .where('role_id', roleId)
      .whereNull('deleted_at')
      .first<{ role_id: string } | undefined>();

    return row ?? null;
  }

  async findUnitById(unitId: string): Promise<{ unit_id: string } | null> {
    const row = await this.db('units')
      .select('unit_id')
      .where('unit_id', unitId)
      .whereNull('deleted_at')
      .first<{ unit_id: string } | undefined>();

    return row ?? null;
  }

  async findActiveUserUnits(userId: string): Promise<{ unit_id: string }[]> {
    const rows = await this.db('user_units')
      .select('unit_id')
      .where('user_id', userId)
      .whereNull('deleted_at');

    return rows as { unit_id: string }[];
  }

  async create(
    data: CreateUserData,
  ): Promise<{ user_id: string; username: string }> {
    const [row] = await this.db('users')
      .insert({
        role_id: data.role_id,
        full_name: data.full_name,
        username: data.username,
        email: data.email,
        password: data.password,
        is_active: data.is_active,
        must_change_password: data.must_change_password,
        last_login_at: this.db.fn.now(),
        created_at: this.db.fn.now(),
        updated_at: this.db.fn.now(),
      })
      .returning(['user_id', 'username']);

    return row as { user_id: string; username: string };
  }

  async createUserUnit(userId: string, unitId: string): Promise<void> {
    await this.db('user_units').insert({
      user_id: userId,
      unit_id: unitId,
      assigned_at: this.db.fn.now(),
      revoked_at: null,
      created_at: this.db.fn.now(),
      updated_at: this.db.fn.now(),
    });
  }

  async createWithUnit(
    data: CreateUserData,
    unitId: string,
  ): Promise<{ user_id: string; username: string }> {
    return this.db.transaction(async (trx) => {
      const [row] = await trx('users')
        .insert({
          role_id: data.role_id,
          full_name: data.full_name,
          username: data.username,
          email: data.email,
          password: data.password,
          is_active: data.is_active,
          must_change_password: data.must_change_password,
          last_login_at: trx.fn.now(),
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        })
        .returning(['user_id', 'username']);

      await trx('user_units').insert({
        user_id: row.user_id,
        unit_id: unitId,
        assigned_at: trx.fn.now(),
        revoked_at: null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      });

      return row as { user_id: string; username: string };
    });
  }

  async update(id: string, data: UpdateUserData): Promise<void> {
    const payload: Record<string, unknown> = {
      updated_at: this.db.fn.now(),
    };

    if (data.full_name !== undefined) payload.full_name = data.full_name;
    if (data.username !== undefined) payload.username = data.username;
    if (data.email !== undefined) payload.email = data.email;
    if (data.role_id !== undefined) payload.role_id = data.role_id;
    if (data.is_active !== undefined) payload.is_active = data.is_active;

    await this.db('users')
      .where('user_id', id)
      .whereNull('deleted_at')
      .update(payload);
  }

  async revokeUserUnits(userId: string): Promise<void> {
    await this.db('user_units')
      .where('user_id', userId)
      .whereNull('deleted_at')
      .update({
        deleted_at: this.db.fn.now(),
        revoked_at: this.db.fn.now(),
        updated_at: this.db.fn.now(),
      });
  }

  async replaceUserUnit(userId: string, unitId: string): Promise<void> {
    await this.db.transaction(async (trx) => {
      await trx('user_units')
        .where('user_id', userId)
        .whereNull('deleted_at')
        .update({
          deleted_at: trx.fn.now(),
          revoked_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        });

      await trx('user_units').insert({
        user_id: userId,
        unit_id: unitId,
        assigned_at: trx.fn.now(),
        revoked_at: null,
        created_at: trx.fn.now(),
        updated_at: trx.fn.now(),
      });
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.db('users').where('user_id', id).whereNull('deleted_at').update({
      deleted_at: this.db.fn.now(),
      updated_at: this.db.fn.now(),
    });
  }

  async softDeleteUserUnits(userId: string): Promise<void> {
    await this.db('user_units')
      .where('user_id', userId)
      .whereNull('deleted_at')
      .update({
        deleted_at: this.db.fn.now(),
        updated_at: this.db.fn.now(),
      });
  }
}
