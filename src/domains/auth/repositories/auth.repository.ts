import type { Knex } from 'knex';
import type { UserWithRole, UserForMe } from '../models/auth.model';

export interface IAuthRepository {
  findUserByUsername(username: string): Promise<UserWithRole | null>;
  getUserPermissions(roleId: string): Promise<string[]>;
  getUserUnits(userId: string): Promise<string[]>;
  updateLastLogin(userId: string): Promise<void>;
  findUserById(userId: string): Promise<UserForMe | null>;
}

export class AuthRepository implements IAuthRepository {
  constructor(private readonly db: Knex) {}

  async findUserByUsername(username: string): Promise<UserWithRole | null> {
    const row = await this.db('users as u')
      .select(
        'u.user_id',
        'u.role_id',
        'u.full_name',
        'u.username',
        'u.email',
        'u.password',
        'u.is_active',
        'u.must_change_password',
        'r.role_code',
      )
      .leftJoin('roles as r', function () {
        this.on('r.role_id', '=', 'u.role_id').andOnNull('r.deleted_at');
      })
      .where('u.username', username)
      .whereNull('u.deleted_at')
      .first<UserWithRole | undefined>();

    return row ?? null;
  }

  async getUserPermissions(roleId: string): Promise<string[]> {
    const rows = await this.db('role_permissions as rp')
      .select('p.feature')
      .leftJoin('permissions as p', function () {
        this.on('p.permission_id', '=', 'rp.permission_id').andOnNull(
          'p.deleted_at',
        );
      })
      .where('rp.role_id', roleId)
      .whereNull('rp.deleted_at')
      .whereNotNull('p.feature');

    return rows.map((row: { feature: string }) => row.feature);
  }

  async getUserUnits(userId: string): Promise<string[]> {
    const rows = await this.db('user_units as uu')
      .select('u.unit_name')
      .leftJoin('units as u', function () {
        this.on('u.unit_id', '=', 'uu.unit_id').andOnNull('u.deleted_at');
      })
      .where('uu.user_id', userId)
      .whereNull('uu.revoked_at')
      .whereNull('uu.deleted_at')
      .whereNotNull('u.unit_name');

    return rows.map((row: { unit_name: string }) => row.unit_name);
  }

  async updateLastLogin(userId: string): Promise<void> {
    await this.db('users').where('user_id', userId).update({
      last_login_at: this.db.fn.now(),
      updated_at: this.db.fn.now(),
    });
  }

  async findUserById(userId: string): Promise<UserForMe | null> {
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
      .where('u.user_id', userId)
      .whereNull('u.deleted_at')
      .first<Omit<UserForMe, 'business_units'> | undefined>();

    if (!row) return null;

    const unitRows = await this.db('user_units as uu')
      .join('units as un', function () {
        this.on('un.unit_id', '=', 'uu.unit_id').andOnNull('un.deleted_at');
      })
      .where('uu.user_id', userId)
      .whereNull('uu.deleted_at')
      .select(
        'un.unit_id as business_unit_id',
        'un.unit_name as business_unit_name',
      );

    return {
      ...row,
      business_units: unitRows as Array<{
        business_unit_id: string;
        business_unit_name: string;
      }>,
    };
  }
}
