import type { Knex } from 'knex';
import type { UserWithRole } from '../models/auth.model';

export interface IAuthRepository {
  findUserByUsername(username: string): Promise<UserWithRole | null>;
  getUserPermissions(roleId: string): Promise<string[]>;
  getUserUnits(userId: string): Promise<string[]>;
  updateLastLogin(userId: string): Promise<void>;
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
}
