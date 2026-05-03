import { readFileSync } from 'fs';
import path from 'path';
import { getAppConfig } from '../../src/config';
import { createStorageClient } from '../../src/config/storage.config';
import { createDatabase, destroyDatabase } from '../../src/database';
import { createLogger } from '../../src/logger';
import { AppError } from '../../src/common/errors/app-error';
import { DomainErrorCodes } from '../../src/common/errors/error-codes-domain';
import { StorageRepository } from '../../src/libs/storage/repositories/storage.repository';
import { StorageService } from '../../src/libs/storage/storage.service';
import { loadEnv } from '../../src/utils/load-env';
import type { Knex } from 'knex';

loadEnv();

const ASSETS_DIR = path.join(__dirname, '../assets/images');
const TEST_FOLDER = 'test';

describe('StorageService — Integration', () => {
  let service: StorageService;
  let db: Knex;
  const trackedBlobIds: string[] = [];

  beforeAll(() => {
    const config = getAppConfig();
    db = createDatabase(config.database);
    const storageClient = createStorageClient(config.storage);
    const logger = createLogger(config.logger);
    const repository = new StorageRepository(db);
    service = new StorageService(
      repository,
      storageClient,
      config.storage,
      logger,
    );
  });

  afterAll(async () => {
    if (trackedBlobIds.length > 0) {
      await db('large_objects')
        .whereIn('id_blob', trackedBlobIds)
        .delete()
        .catch(() => {});
    }

    const config = getAppConfig();
    const storageClient = createStorageClient(config.storage);
    const bucket = storageClient.from(config.storage.bucketName);
    const { data: files } = await bucket
      .list(TEST_FOLDER)
      .catch(() => ({ data: [] }));
    if (files && files.length > 0) {
      const paths = files.map((f) => `${TEST_FOLDER}/${f.name}`);
      await bucket.remove(paths).catch(() => {});
    }

    await destroyDatabase(db);
  });

  // ---------------------------------------------------------------------------
  // 1. Upload
  // ---------------------------------------------------------------------------

  describe('uploadFile', () => {
    it('uploads a JPEG file and returns a DB record', async () => {
      const fileBuffer = readFileSync(
        path.join(ASSETS_DIR, 'file-for-upload.jpg'),
      );

      const result = await service.uploadFile({
        file: fileBuffer,
        fileName: 'file-for-upload.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: fileBuffer.length,
        folder: TEST_FOLDER,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data.id_blob).toBeDefined();
      expect(result.data.mime).toBe('image/jpeg');
      expect(result.data.path).toMatch(new RegExp(`^${TEST_FOLDER}/`));

      trackedBlobIds.push(result.data.id_blob);
    });
  });

  // ---------------------------------------------------------------------------
  // 2. Retrieve
  // ---------------------------------------------------------------------------

  describe('getFile', () => {
    it('generates a signed HTTPS URL for the uploaded file', async () => {
      const idBlob = trackedBlobIds[0];
      expect(idBlob).toBeDefined();

      const result = await service.getFile(idBlob);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data.signed_url).toMatch(/^https?:\/\//);
    });

    it('throws 404 for a non-existent id', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      await expect(service.getFile(nonExistentId)).rejects.toMatchObject({
        code: DomainErrorCodes.StorageBlobNotFound,
        status: 404,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 3. Update
  // ---------------------------------------------------------------------------

  describe('updateFile', () => {
    it('replaces the file with a new one and updates the DB record', async () => {
      const idBlob = trackedBlobIds[0];
      expect(idBlob).toBeDefined();

      const fileBuffer = readFileSync(
        path.join(ASSETS_DIR, 'file-for-update.png'),
      );

      const result = await service.updateFile(idBlob, {
        file: fileBuffer,
        fileName: 'file-for-update.png',
        mimeType: 'image/png',
        sizeBytes: fileBuffer.length,
        folder: TEST_FOLDER,
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data.mime).toBe('image/png');
      expect(result.data.file_name).toBe('file-for-update.png');
    });
  });

  // ---------------------------------------------------------------------------
  // 4. Delete
  // ---------------------------------------------------------------------------

  describe('deleteFile', () => {
    it('soft-deletes the record and removes the file from Supabase', async () => {
      const idBlob = trackedBlobIds[0];
      expect(idBlob).toBeDefined();

      const result = await service.deleteFile(idBlob);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);

      trackedBlobIds.splice(trackedBlobIds.indexOf(idBlob), 1);
    });

    it('throws 404 when trying to get a deleted file', async () => {
      const deletedIdBlob = trackedBlobIds[0];

      if (!deletedIdBlob) {
        const row = await db('large_objects')
          .whereNotNull('deleted_at')
          .first<{ id_blob: string }>();

        if (!row) return;

        await expect(service.getFile(row.id_blob)).rejects.toMatchObject({
          code: DomainErrorCodes.StorageBlobNotFound,
          status: 404,
        });
        return;
      }

      await expect(service.getFile(deletedIdBlob)).rejects.toMatchObject({
        code: DomainErrorCodes.StorageBlobNotFound,
        status: 404,
      });
    });

    it('throws 404 when trying to delete an already-deleted file', async () => {
      const uploadBuffer = readFileSync(
        path.join(ASSETS_DIR, 'file-for-upload.jpg'),
      );

      const uploaded = await service.uploadFile({
        file: uploadBuffer,
        fileName: 'file-for-delete-test.jpg',
        mimeType: 'image/jpeg',
        sizeBytes: uploadBuffer.length,
        folder: TEST_FOLDER,
      });
      const idBlob = uploaded.data.id_blob;
      trackedBlobIds.push(idBlob);

      await service.deleteFile(idBlob);
      trackedBlobIds.splice(trackedBlobIds.indexOf(idBlob), 1);

      await expect(service.deleteFile(idBlob)).rejects.toMatchObject({
        code: DomainErrorCodes.StorageBlobNotFound,
        status: 404,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // 5. Error: AppError is thrown correctly
  // ---------------------------------------------------------------------------

  describe('error handling', () => {
    it('throws storageFileTooLargeError when file exceeds 5MB', async () => {
      const oversizedBuffer = Buffer.alloc(6 * 1024 * 1024, 'x');

      await expect(
        service.uploadFile({
          file: oversizedBuffer,
          fileName: 'oversized.jpg',
          mimeType: 'image/jpeg',
          sizeBytes: oversizedBuffer.length,
          folder: TEST_FOLDER,
        }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.StorageFileTooLarge,
        status: 400,
      });
    });

    it('all thrown errors are AppError instances', async () => {
      await expect(
        service.getFile('00000000-0000-0000-0000-000000000000'),
      ).rejects.toBeInstanceOf(AppError);
    });
  });
});
