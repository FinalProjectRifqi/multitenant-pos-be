import type { Knex } from 'knex';
import type { LargeObjectRow } from '../models/storage.model';
import { StorageRepository } from '../repositories/storage.repository';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';

const createLargeObjectRow = (
  overrides?: Partial<LargeObjectRow>,
): LargeObjectRow => ({
  id_blob: VALID_UUID,
  file_name: 'photo.jpg',
  stored_name: VALID_UUID,
  mime: 'image/jpeg',
  path: `products/${VALID_UUID}.jpg`,
  size_bytes: 102400,
  uploaded_at: new Date('2026-01-01T00:00:00.000Z'),
  deleted_at: null,
  ...overrides,
});

type MockBuilder = {
  where: jest.Mock;
  insert: jest.Mock;
  update: jest.Mock;
  returning: jest.Mock;
  first: jest.Mock;
};

const createBuilder = (): MockBuilder => {
  const builder: MockBuilder = {
    where: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    returning: jest.fn(),
    first: jest.fn(),
  };

  builder.where.mockReturnValue(builder);
  builder.insert.mockReturnValue(builder);
  builder.update.mockReturnValue(builder);
  builder.returning.mockReturnValue(builder);

  return builder;
};

describe('StorageRepository', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('insert', () => {
    it('inserts a row and returns the inserted record', async () => {
      const row = createLargeObjectRow();
      const builder = createBuilder();
      builder.returning.mockResolvedValueOnce([row]);

      const db = jest.fn().mockReturnValue(builder) as unknown as Knex;
      const repository = new StorageRepository(db);

      const result = await repository.insert({
        file_name: row.file_name,
        stored_name: row.stored_name,
        mime: row.mime,
        path: row.path,
        size_bytes: row.size_bytes,
      });

      expect(result).toEqual(row);
      expect(builder.insert).toHaveBeenCalledWith(
        expect.objectContaining({ file_name: row.file_name }),
      );
      expect(builder.returning).toHaveBeenCalledWith('*');
    });
  });

  describe('findById', () => {
    it('returns the row when found', async () => {
      const row = createLargeObjectRow();
      const builder = createBuilder();
      builder.first.mockResolvedValueOnce(row);

      const db = jest.fn().mockReturnValue(builder) as unknown as Knex;
      const repository = new StorageRepository(db);

      const result = await repository.findById(VALID_UUID);

      expect(result).toEqual(row);
      expect(builder.where).toHaveBeenCalledWith({ id_blob: VALID_UUID });
    });

    it('returns null when row is not found', async () => {
      const builder = createBuilder();
      builder.first.mockResolvedValueOnce(undefined);

      const db = jest.fn().mockReturnValue(builder) as unknown as Knex;
      const repository = new StorageRepository(db);

      const result = await repository.findById(VALID_UUID);

      expect(result).toBeNull();
    });
  });

  describe('updateById', () => {
    it('updates the row and returns the updated record', async () => {
      const updatedRow = createLargeObjectRow({ mime: 'image/png', size_bytes: 204800 });
      const builder = createBuilder();
      builder.returning.mockResolvedValueOnce([updatedRow]);

      const db = jest.fn().mockReturnValue(builder) as unknown as Knex;
      const repository = new StorageRepository(db);

      const result = await repository.updateById(VALID_UUID, {
        file_name: updatedRow.file_name,
        stored_name: updatedRow.stored_name,
        mime: 'image/png',
        path: updatedRow.path,
        size_bytes: 204800,
      });

      expect(result).toEqual(updatedRow);
      expect(builder.where).toHaveBeenCalledWith({ id_blob: VALID_UUID });
      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({ mime: 'image/png' }),
      );
      expect(builder.returning).toHaveBeenCalledWith('*');
    });
  });

  describe('softDeleteById', () => {
    it('sets deleted_at to current timestamp', async () => {
      const builder = createBuilder();
      builder.update.mockResolvedValueOnce(1);

      const mockNow = jest.fn(() => new Date('2026-01-01T00:00:00.000Z'));
      const db = Object.assign(
        jest.fn().mockReturnValue(builder),
        { fn: { now: mockNow } },
      ) as unknown as Knex;
      const repository = new StorageRepository(db);

      await repository.softDeleteById(VALID_UUID);

      expect(builder.where).toHaveBeenCalledWith({ id_blob: VALID_UUID });
      expect(builder.update).toHaveBeenCalledWith(
        expect.objectContaining({ deleted_at: expect.anything() }),
      );
    });
  });

  describe('undoSoftDeleteById', () => {
    it('sets deleted_at back to null', async () => {
      const builder = createBuilder();
      builder.update.mockResolvedValueOnce(1);

      const db = Object.assign(
        jest.fn().mockReturnValue(builder),
        { fn: { now: jest.fn() } },
      ) as unknown as Knex;
      const repository = new StorageRepository(db);

      await repository.undoSoftDeleteById(VALID_UUID);

      expect(builder.where).toHaveBeenCalledWith({ id_blob: VALID_UUID });
      expect(builder.update).toHaveBeenCalledWith({ deleted_at: null });
    });
  });
});
