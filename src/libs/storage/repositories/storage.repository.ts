import type { Knex } from 'knex';
import type { LargeObjectRow } from '../models/storage.model';

export interface CreateLargeObjectData {
  file_name: string;
  stored_name: string;
  mime: string;
  path: string;
  size_bytes: number;
}

export interface UpdateLargeObjectData {
  file_name: string;
  stored_name: string;
  mime: string;
  path: string;
  size_bytes: number;
}

export interface IStorageRepository {
  insert(data: CreateLargeObjectData): Promise<LargeObjectRow>;
  findById(idBlob: string): Promise<LargeObjectRow | null>;
  updateById(idBlob: string, data: UpdateLargeObjectData): Promise<LargeObjectRow>;
  softDeleteById(idBlob: string): Promise<void>;
  undoSoftDeleteById(idBlob: string): Promise<void>;
}

export class StorageRepository implements IStorageRepository {
  constructor(private readonly db: Knex) {}

  async insert(data: CreateLargeObjectData): Promise<LargeObjectRow> {
    const [row] = await this.db<LargeObjectRow>('large_objects')
      .insert(data)
      .returning('*');
    return row;
  }

  async findById(idBlob: string): Promise<LargeObjectRow | null> {
    const row = await this.db<LargeObjectRow>('large_objects')
      .where({ id_blob: idBlob })
      .first();
    return row ?? null;
  }

  async updateById(
    idBlob: string,
    data: UpdateLargeObjectData,
  ): Promise<LargeObjectRow> {
    const [row] = await this.db<LargeObjectRow>('large_objects')
      .where({ id_blob: idBlob })
      .update(data)
      .returning('*');
    return row;
  }

  async softDeleteById(idBlob: string): Promise<void> {
    await this.db('large_objects')
      .where({ id_blob: idBlob })
      .update({ deleted_at: this.db.fn.now() });
  }

  async undoSoftDeleteById(idBlob: string): Promise<void> {
    await this.db('large_objects')
      .where({ id_blob: idBlob })
      .update({ deleted_at: null });
  }
}
