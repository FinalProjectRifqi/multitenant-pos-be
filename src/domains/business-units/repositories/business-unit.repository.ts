import type { Knex } from 'knex';
import type {
  BusinessUnit,
  BusinessUnitStats,
} from '../models/business-unit.model';

interface FindAllParams {
  page: number;
  limit: number;
  search?: string;
  showInactive: boolean;
}

interface CreateUnitData {
  unit_name: string;
  unit_address: string;
  phone_number?: string | null;
  status: 'active' | 'inactive';
}

interface UpdateUnitData {
  unit_name?: string;
  unit_address?: string;
  phone_number?: string | null;
  status?: 'active' | 'inactive';
}

interface RawBusinessUnitStats {
  total_business_unit: string;
  business_unit_active: string;
  business_unit_inactive: string;
}

export interface IBusinessUnitRepository {
  findAll(
    params: FindAllParams,
  ): Promise<{ data: BusinessUnit[]; total: number }>;
  findById(id: string): Promise<BusinessUnit | null>;
  findByName(name: string, excludeId?: string): Promise<BusinessUnit | null>;
  getStats(): Promise<BusinessUnitStats>;
  create(data: CreateUnitData): Promise<BusinessUnit>;
  update(id: string, data: UpdateUnitData): Promise<BusinessUnit>;
  softDelete(id: string): Promise<void>;
}

export class BusinessUnitRepository implements IBusinessUnitRepository {
  constructor(private readonly db: Knex) {}

  async findAll(
    params: FindAllParams,
  ): Promise<{ data: BusinessUnit[]; total: number }> {
    const { page, limit, search, showInactive } = params;
    const offset = (page - 1) * limit;

    const buildBaseQuery = () => {
      const query = this.db('units').whereNull('deleted_at');

      if (!showInactive) {
        query.where('status', 'active');
      }

      if (search && search.length > 0) {
        query.where(function () {
          this.whereILike('unit_name', `%${search}%`)
            .orWhereILike('unit_address', `%${search}%`)
            .orWhereILike('phone_number', `%${search}%`);
        });
      }

      return query;
    };

    const [data, countResult] = await Promise.all([
      buildBaseQuery()
        .select(
          'unit_id',
          'unit_name',
          'unit_address',
          'phone_number',
          'status',
          'created_at',
          'updated_at',
          'deleted_at',
        )
        .orderBy('created_at', 'desc')
        .limit(limit)
        .offset(offset),
      buildBaseQuery()
        .count('unit_id as count')
        .first<{ count: string | number }>(),
    ]);

    const total = Number(countResult?.count ?? 0);

    return { data: data as BusinessUnit[], total };
  }

  async findById(id: string): Promise<BusinessUnit | null> {
    const row = await this.db('units')
      .select(
        'unit_id',
        'unit_name',
        'unit_address',
        'phone_number',
        'status',
        'created_at',
        'updated_at',
        'deleted_at',
      )
      .where('unit_id', id)
      .whereNull('deleted_at')
      .first<BusinessUnit | undefined>();

    return row ?? null;
  }

  async findByName(
    name: string,
    excludeId?: string,
  ): Promise<BusinessUnit | null> {
    const query = this.db('units')
      .select(
        'unit_id',
        'unit_name',
        'unit_address',
        'phone_number',
        'status',
        'created_at',
        'updated_at',
        'deleted_at',
      )
      .whereRaw('LOWER(TRIM(unit_name)) = LOWER(TRIM(?))', [name])
      .whereNull('deleted_at');

    if (excludeId) {
      query.whereNot('unit_id', excludeId);
    }

    const row = await query.first<BusinessUnit | undefined>();
    return row ?? null;
  }

  async getStats(): Promise<BusinessUnitStats> {
    const row = await this.db('units')
      .whereNull('deleted_at')
      .select(
        this.db.raw('COUNT(*) AS total_business_unit'),
        this.db.raw(
          "COUNT(*) FILTER (WHERE status = 'active') AS business_unit_active",
        ),
        this.db.raw(
          "COUNT(*) FILTER (WHERE status = 'inactive') AS business_unit_inactive",
        ),
      )
      .first<RawBusinessUnitStats | undefined>();

    return {
      total_business_unit: Number(row?.total_business_unit ?? 0),
      business_unit_active: Number(row?.business_unit_active ?? 0),
      business_unit_inactive: Number(row?.business_unit_inactive ?? 0),
    };
  }

  async create(data: CreateUnitData): Promise<BusinessUnit> {
    const [row] = await this.db('units')
      .insert({
        unit_name: data.unit_name,
        unit_address: data.unit_address,
        phone_number: data.phone_number ?? null,
        status: data.status,
        created_at: this.db.fn.now(),
        updated_at: this.db.fn.now(),
      })
      .returning([
        'unit_id',
        'unit_name',
        'unit_address',
        'phone_number',
        'status',
        'created_at',
        'updated_at',
        'deleted_at',
      ]);

    return row as BusinessUnit;
  }

  async update(id: string, data: UpdateUnitData): Promise<BusinessUnit> {
    const updatePayload: Record<string, unknown> = {
      updated_at: this.db.fn.now(),
    };

    if (data.unit_name !== undefined) updatePayload.unit_name = data.unit_name;
    if (data.unit_address !== undefined)
      updatePayload.unit_address = data.unit_address;
    if (data.phone_number !== undefined)
      updatePayload.phone_number = data.phone_number;
    if (data.status !== undefined) updatePayload.status = data.status;

    const [row] = await this.db('units')
      .where('unit_id', id)
      .whereNull('deleted_at')
      .update(updatePayload)
      .returning([
        'unit_id',
        'unit_name',
        'unit_address',
        'phone_number',
        'status',
        'created_at',
        'updated_at',
        'deleted_at',
      ]);

    return row as BusinessUnit;
  }

  async softDelete(id: string): Promise<void> {
    await this.db('units').where('unit_id', id).whereNull('deleted_at').update({
      deleted_at: this.db.fn.now(),
      updated_at: this.db.fn.now(),
    });
  }
}
