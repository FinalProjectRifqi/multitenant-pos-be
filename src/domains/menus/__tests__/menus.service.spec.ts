import type { Logger } from 'pino';
import { AppError } from '../../../common/errors/app-error';
import { ErrorCodes } from '../../../common/errors/error-codes';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import type { AppConfig } from '../../../config';
import type { StorageService } from '../../../libs/storage/storage.service';
import { MenuService } from '../menus.service';
import type { MenuRow, MenuStats } from '../models/menu.model';
import type { IMenuRepository } from '../repositories/menu.repository';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BUSINESS_ID = '550e8400-e29b-41d4-a716-446655440000';
const MENU_ID = '660e8400-e29b-41d4-a716-446655440001';
const CATEGORY_ID = '770e8400-e29b-41d4-a716-446655440002';
const BLOB_ID = '880e8400-e29b-41d4-a716-446655440003';
const SIGNED_URL = 'https://storage.example.com/signed/menu-image.jpg';

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------

const createMockRepository = (): jest.Mocked<IMenuRepository> => ({
  findUnitById: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  getStats: jest.fn(),
  findCategoryById: jest.fn(),
  findByName: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  softDelete: jest.fn(),
  undoSoftDelete: jest.fn(),
});

const createMockStorageService = (): jest.Mocked<StorageService> =>
  ({
    uploadFile: jest.fn(),
    getFile: jest.fn(),
    updateFile: jest.fn(),
    deleteFile: jest.fn(),
  }) as unknown as jest.Mocked<StorageService>;

const createMockLogger = (): jest.Mocked<Logger> =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<Logger>;

const createMockConfig = (): AppConfig =>
  ({
    storage: {
      maxFileSizeBytes: 5 * 1024 * 1024, // 5MB
    },
  }) as unknown as AppConfig;

const createMenuRow = (overrides?: Partial<MenuRow>): MenuRow => ({
  menu_id: MENU_ID,
  menu_name: 'Nasi Goreng',
  menu_category_id: CATEGORY_ID,
  menu_category_name: 'Makanan',
  menu_price: '25000',
  blob_id: null,
  business_unit_id: BUSINESS_ID,
  business_unit_name: 'Restoran A',
  is_available: true,
  ...overrides,
});

const createMulterFile = (
  overrides?: Partial<Express.Multer.File>,
): Express.Multer.File =>
  ({
    fieldname: 'menu_image',
    originalname: 'nasi-goreng.jpg',
    encoding: '7bit',
    mimetype: 'image/jpeg',
    buffer: Buffer.from('fake-image-data'),
    size: 1024,
    ...overrides,
  }) as Express.Multer.File;

const createUploadResult = (blobId = BLOB_ID) => ({
  success: true as const,
  statusCode: 201 as const,
  message: 'File uploaded',
  data: {
    id_blob: blobId,
    file_name: 'nasi-goreng.jpg',
    stored_name: 'abc-nasi-goreng.jpg',
    mime: 'image/jpeg',
    path: `menus/${BUSINESS_ID}/abc-nasi-goreng.jpg`,
    size_bytes: 1024,
    uploaded_at: new Date(),
  },
});

const createGetFileResult = (signedUrl = SIGNED_URL) => ({
  success: true as const,
  statusCode: 200 as const,
  message: 'File fetched',
  data: {
    id_blob: BLOB_ID,
    file_name: 'nasi-goreng.jpg',
    stored_name: 'abc-nasi-goreng.jpg',
    mime: 'image/jpeg',
    path: `menus/${BUSINESS_ID}/abc-nasi-goreng.jpg`,
    size_bytes: 1024,
    uploaded_at: new Date(),
    signed_url: signedUrl,
  },
});

const createUpdateFileResult = () => ({
  success: true as const,
  statusCode: 200 as const,
  message: 'File updated',
  data: {
    id_blob: BLOB_ID,
    file_name: 'nasi-goreng.jpg',
    stored_name: 'abc-nasi-goreng.jpg',
    mime: 'image/jpeg',
    path: `menus/${BUSINESS_ID}/abc-nasi-goreng.jpg`,
    size_bytes: 1024,
    uploaded_at: new Date(),
  },
});

const createDeleteFileResult = () => ({
  success: true as const,
  statusCode: 200 as const,
  message: 'File deleted',
  data: null,
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe('MenuService', () => {
  let service: MenuService;
  let mockRepository: jest.Mocked<IMenuRepository>;
  let mockStorageService: jest.Mocked<StorageService>;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfig: AppConfig;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockStorageService = createMockStorageService();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();
    service = new MenuService(
      mockRepository,
      mockStorageService,
      mockConfig,
      mockLogger,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // listMenus
  // ---------------------------------------------------------------------------

  describe('listMenus', () => {
    beforeEach(() => {
      mockRepository.findUnitById.mockResolvedValue({
        unit_id: BUSINESS_ID,
        unit_name: 'Restoran A',
      });
    });

    it('returns paginated list with correct envelope and meta', async () => {
      const row = createMenuRow();
      mockRepository.findAll.mockResolvedValueOnce({ data: [row], total: 1 });

      const result = await service.listMenus(BUSINESS_ID, {});

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('uses defaults page=1, limit=10, sortBy=menu_name, sortType=ASC when query is empty', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listMenus(BUSINESS_ID, {});

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: 'menu_name',
          sortType: 'ASC',
        }),
      );
    });

    it('passes through explicit page, limit, sortBy, sortType from query', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listMenus(BUSINESS_ID, {
        page: 3,
        limit: 5,
        sortBy: 'menu_price',
        sortType: 'DESC',
      });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 3,
          limit: 5,
          sortBy: 'menu_price',
          sortType: 'DESC',
        }),
      );
    });

    it('passes trimmed search string when provided', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listMenus(BUSINESS_ID, { search: '  nasi  ' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'nasi' }),
      );
    });

    it('normalizes whitespace-only search to undefined', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listMenus(BUSINESS_ID, { search: '   ' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: undefined }),
      );
    });

    it('maps menu_price string to number in response', async () => {
      const row = createMenuRow({ menu_price: '25000' });
      mockRepository.findAll.mockResolvedValueOnce({ data: [row], total: 1 });

      const result = await service.listMenus(BUSINESS_ID, {});

      expect(result.data[0].menu_price).toBe(25000);
    });

    it('resolves signed URLs in parallel for menus with blob_id', async () => {
      const row1 = createMenuRow({ menu_id: 'id-1', blob_id: 'blob-1' });
      const row2 = createMenuRow({ menu_id: 'id-2', blob_id: 'blob-2' });
      mockRepository.findAll.mockResolvedValueOnce({
        data: [row1, row2],
        total: 2,
      });
      mockStorageService.getFile.mockResolvedValue(createGetFileResult());

      const result = await service.listMenus(BUSINESS_ID, {});

      expect(mockStorageService.getFile).toHaveBeenCalledTimes(2);
      expect(result.data[0].menu_image).toBe(SIGNED_URL);
      expect(result.data[1].menu_image).toBe(SIGNED_URL);
    });

    it('sets menu_image to null for menus without blob_id', async () => {
      const row = createMenuRow({ blob_id: null });
      mockRepository.findAll.mockResolvedValueOnce({ data: [row], total: 1 });

      const result = await service.listMenus(BUSINESS_ID, {});

      expect(result.data[0].menu_image).toBeNull();
      expect(mockStorageService.getFile).not.toHaveBeenCalled();
    });

    it('sets menu_image to null when signed URL fetch fails (graceful degradation)', async () => {
      const row = createMenuRow({ blob_id: BLOB_ID });
      mockRepository.findAll.mockResolvedValueOnce({ data: [row], total: 1 });
      mockStorageService.getFile.mockRejectedValueOnce(
        new Error('Storage unavailable'),
      );

      const result = await service.listMenus(BUSINESS_ID, {});

      expect(result.data[0].menu_image).toBeNull();
    });

    it('calculates correct totalPages for non-even division', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 25 });

      const result = await service.listMenus(BUSINESS_ID, { limit: 10 });

      expect(result.meta.totalPages).toBe(3);
    });

    it('throws 404 UNIT_NOT_FOUND when unit does not exist', async () => {
      mockRepository.findUnitById.mockResolvedValueOnce(null);

      await expect(service.listMenus(BUSINESS_ID, {})).rejects.toMatchObject({
        code: DomainErrorCodes.UnitNotFound,
        status: 404,
      });
    });

    it('throws 500 on unexpected repository error', async () => {
      mockRepository.findAll.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.listMenus(BUSINESS_ID, {})).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });

    it('re-throws AppError without wrapping in 500', async () => {
      const appError = new AppError({
        code: DomainErrorCodes.UnitNotFound,
        message: 'Unit not found',
        status: 404,
      });
      mockRepository.findUnitById.mockRejectedValueOnce(appError);

      await expect(service.listMenus(BUSINESS_ID, {})).rejects.toBe(appError);
    });
  });

  // ---------------------------------------------------------------------------
  // getMenuStats
  // ---------------------------------------------------------------------------

  describe('getMenuStats', () => {
    beforeEach(() => {
      mockRepository.findUnitById.mockResolvedValue({
        unit_id: BUSINESS_ID,
        unit_name: 'Restoran A',
      });
    });

    it('returns stats with correct counts', async () => {
      const stats: MenuStats = {
        total_menu: 20,
        menu_active: 15,
        menu_inactive: 5,
      };
      mockRepository.getStats.mockResolvedValueOnce(stats);

      const result = await service.getMenuStats(BUSINESS_ID);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(stats);
    });

    it('throws 404 UNIT_NOT_FOUND when unit does not exist', async () => {
      mockRepository.findUnitById.mockResolvedValueOnce(null);

      await expect(service.getMenuStats(BUSINESS_ID)).rejects.toMatchObject({
        code: DomainErrorCodes.UnitNotFound,
        status: 404,
      });

      expect(mockRepository.getStats).not.toHaveBeenCalled();
    });

    it('throws 500 on unexpected repository error', async () => {
      mockRepository.getStats.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.getMenuStats(BUSINESS_ID)).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createMenu
  // ---------------------------------------------------------------------------

  describe('createMenu', () => {
    const validDto = {
      menu_name: 'Nasi Goreng',
      menu_category_id: CATEGORY_ID,
      item_price: 25000,
      is_available: true,
    };

    beforeEach(() => {
      mockRepository.findUnitById.mockResolvedValue({
        unit_id: BUSINESS_ID,
        unit_name: 'Restoran A',
      });
      mockRepository.findCategoryById.mockResolvedValue({
        menu_category_id: CATEGORY_ID,
        category_name: 'Makanan',
      });
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.create.mockResolvedValue({ menu_item_id: MENU_ID });
      mockRepository.findById.mockResolvedValue(createMenuRow());
    });

    it('returns 201 with menu data on success (no image)', async () => {
      const result = await service.createMenu(BUSINESS_ID, validDto);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(201);
      expect(result.data.menu_id).toBe(MENU_ID);
      expect(result.data.menu_image).toBeNull();
    });

    it('returns 201 with signed URL when image is uploaded', async () => {
      const file = createMulterFile();
      mockStorageService.uploadFile.mockResolvedValueOnce(createUploadResult());
      mockStorageService.getFile.mockResolvedValueOnce(createGetFileResult());
      mockRepository.findById.mockResolvedValue(
        createMenuRow({ blob_id: BLOB_ID }),
      );

      const result = await service.createMenu(BUSINESS_ID, validDto, file);

      expect(result.statusCode).toBe(201);
      expect(result.data.menu_image).toBe(SIGNED_URL);
    });

    it('uploads to correct storage folder', async () => {
      const file = createMulterFile();
      mockStorageService.uploadFile.mockResolvedValueOnce(createUploadResult());
      mockStorageService.getFile.mockResolvedValueOnce(createGetFileResult());

      await service.createMenu(BUSINESS_ID, validDto, file);

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          folder: `menus/${BUSINESS_ID}`,
        }),
      );
    });

    it('passes file buffer, mimeType, and sizeBytes to storage upload', async () => {
      const file = createMulterFile({
        buffer: Buffer.from('data'),
        mimetype: 'image/png',
        size: 2048,
        originalname: 'test.png',
      });
      mockStorageService.uploadFile.mockResolvedValueOnce(createUploadResult());
      mockStorageService.getFile.mockResolvedValueOnce(createGetFileResult());

      await service.createMenu(BUSINESS_ID, validDto, file);

      expect(mockStorageService.uploadFile).toHaveBeenCalledWith(
        expect.objectContaining({
          mimeType: 'image/png',
          sizeBytes: 2048,
          fileName: 'test.png',
        }),
      );
    });

    it('stores blob_id in DB when image is uploaded', async () => {
      const file = createMulterFile();
      mockStorageService.uploadFile.mockResolvedValueOnce(createUploadResult());
      mockStorageService.getFile.mockResolvedValueOnce(createGetFileResult());

      await service.createMenu(BUSINESS_ID, validDto, file);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ blob_id: BLOB_ID }),
        BUSINESS_ID,
      );
    });

    it('stores null blob_id in DB when no image', async () => {
      await service.createMenu(BUSINESS_ID, validDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ blob_id: null }),
        BUSINESS_ID,
      );
    });

    it('throws 404 UNIT_NOT_FOUND when unit does not exist', async () => {
      mockRepository.findUnitById.mockResolvedValueOnce(null);

      await expect(
        service.createMenu(BUSINESS_ID, validDto),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UnitNotFound,
        status: 404,
      });
    });

    it('throws 404 MENU_CATEGORY_NOT_FOUND when category does not belong to unit', async () => {
      mockRepository.findCategoryById.mockResolvedValueOnce(null);

      await expect(
        service.createMenu(BUSINESS_ID, validDto),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.MenuCategoryNotFound,
        status: 404,
      });
    });

    it('throws 409 MENU_CONFLICT when name already exists in the unit', async () => {
      mockRepository.findByName.mockResolvedValueOnce({
        menu_item_id: 'existing-id',
      });

      await expect(
        service.createMenu(BUSINESS_ID, validDto),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.MenuConflict,
        status: 409,
        details: [
          expect.objectContaining({
            property: 'menu_name',
            constraints: expect.objectContaining({
              unique: 'Nama menu sudah digunakan di unit usaha ini',
            }),
          }),
        ],
      });
    });

    it('allows the same name when it only exists in another unit', async () => {
      const dto = {
        ...validDto,
        menu_name: 'Es Jeruk',
      };

      await expect(service.createMenu(BUSINESS_ID, dto)).resolves.toMatchObject({
        statusCode: 201,
      });

      expect(mockRepository.findByName).toHaveBeenCalledWith(
        'Es Jeruk',
        BUSINESS_ID,
      );
      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ menu_item_name: 'Es Jeruk' }),
        BUSINESS_ID,
      );
    });

    it('throws 400 MENU_INVALID_IMAGE_TYPE when file is not an image', async () => {
      const file = createMulterFile({ mimetype: 'application/pdf' });

      await expect(
        service.createMenu(BUSINESS_ID, validDto, file),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.MenuInvalidImageType,
        status: 400,
      });

      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('throws 400 VALIDATION_FAILED when file exceeds max size', async () => {
      const oversizedFile = createMulterFile({
        size: 6 * 1024 * 1024, // 6MB, exceeds 5MB limit
      });

      await expect(
        service.createMenu(BUSINESS_ID, validDto, oversizedFile),
      ).rejects.toMatchObject({
        code: ErrorCodes.ValidationFailed,
        status: 400,
      });

      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('compensates (deletes) uploaded file when DB insert fails', async () => {
      const file = createMulterFile();
      mockStorageService.uploadFile.mockResolvedValueOnce(createUploadResult());
      mockStorageService.deleteFile.mockResolvedValueOnce(
        createDeleteFileResult(),
      );
      mockRepository.create.mockRejectedValueOnce(new Error('DB constraint'));

      await expect(
        service.createMenu(BUSINESS_ID, validDto, file),
      ).rejects.toThrow();

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(BLOB_ID);
    });

    it('logs error and continues when storage compensation fails after DB error', async () => {
      const file = createMulterFile();
      mockStorageService.uploadFile.mockResolvedValueOnce(createUploadResult());
      mockStorageService.deleteFile.mockRejectedValueOnce(
        new Error('Storage delete failed'),
      );
      mockRepository.create.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.createMenu(BUSINESS_ID, validDto, file),
      ).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ blobId: BLOB_ID }),
        expect.stringContaining('compensation failed'),
      );
    });

    it('does not attempt storage compensation when DB fails but no file was uploaded', async () => {
      mockRepository.create.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.createMenu(BUSINESS_ID, validDto)).rejects.toThrow();

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('throws 500 on unexpected error', async () => {
      mockRepository.create.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.createMenu(BUSINESS_ID, validDto),
      ).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });

    it('re-throws AppError without wrapping in 500', async () => {
      const appError = new AppError({
        code: DomainErrorCodes.MenuCategoryNotFound,
        message: 'Category not found',
        status: 404,
      });
      mockRepository.findCategoryById.mockRejectedValueOnce(appError);

      await expect(service.createMenu(BUSINESS_ID, validDto)).rejects.toBe(
        appError,
      );
    });
  });

  // ---------------------------------------------------------------------------
  // getMenuById
  // ---------------------------------------------------------------------------

  describe('getMenuById', () => {
    beforeEach(() => {
      mockRepository.findUnitById.mockResolvedValue({
        unit_id: BUSINESS_ID,
        unit_name: 'Restoran A',
      });
    });

    it('returns 200 with menu data including business_unit fields', async () => {
      const row = createMenuRow();
      mockRepository.findById.mockResolvedValueOnce(row);

      const result = await service.getMenuById(BUSINESS_ID, MENU_ID);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data.menu_id).toBe(MENU_ID);
      expect(result.data.business_unit_id).toBe(BUSINESS_ID);
    });

    it('includes signed URL when menu has blob_id', async () => {
      const row = createMenuRow({ blob_id: BLOB_ID });
      mockRepository.findById.mockResolvedValueOnce(row);
      mockStorageService.getFile.mockResolvedValueOnce(createGetFileResult());

      const result = await service.getMenuById(BUSINESS_ID, MENU_ID);

      expect(result.data.menu_image).toBe(SIGNED_URL);
    });

    it('returns null menu_image when blob_id is null', async () => {
      const row = createMenuRow({ blob_id: null });
      mockRepository.findById.mockResolvedValueOnce(row);

      const result = await service.getMenuById(BUSINESS_ID, MENU_ID);

      expect(result.data.menu_image).toBeNull();
      expect(mockStorageService.getFile).not.toHaveBeenCalled();
    });

    it('returns null menu_image when signed URL fetch fails', async () => {
      const row = createMenuRow({ blob_id: BLOB_ID });
      mockRepository.findById.mockResolvedValueOnce(row);
      mockStorageService.getFile.mockRejectedValueOnce(
        new Error('Storage unavailable'),
      );

      const result = await service.getMenuById(BUSINESS_ID, MENU_ID);

      expect(result.data.menu_image).toBeNull();
    });

    it('maps menu_price string to number', async () => {
      const row = createMenuRow({ menu_price: '35000' });
      mockRepository.findById.mockResolvedValueOnce(row);

      const result = await service.getMenuById(BUSINESS_ID, MENU_ID);

      expect(result.data.menu_price).toBe(35000);
    });

    it('throws 404 UNIT_NOT_FOUND when unit does not exist', async () => {
      mockRepository.findUnitById.mockResolvedValueOnce(null);

      await expect(
        service.getMenuById(BUSINESS_ID, MENU_ID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UnitNotFound,
        status: 404,
      });
    });

    it('throws 404 MENU_NOT_FOUND when menu does not exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.getMenuById(BUSINESS_ID, MENU_ID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.MenuNotFound,
        status: 404,
      });
    });

    it('throws 500 on unexpected error', async () => {
      mockRepository.findById.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.getMenuById(BUSINESS_ID, MENU_ID),
      ).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateMenu
  // ---------------------------------------------------------------------------

  describe('updateMenu', () => {
    beforeEach(() => {
      mockRepository.findUnitById.mockResolvedValue({
        unit_id: BUSINESS_ID,
        unit_name: 'Restoran A',
      });
      mockRepository.findById.mockResolvedValue(createMenuRow());
      mockRepository.findCategoryById.mockResolvedValue({
        menu_category_id: CATEGORY_ID,
        category_name: 'Makanan',
      });
      mockRepository.findByName.mockResolvedValue(null);
      mockRepository.update.mockResolvedValue();
    });

    it('returns 200 on successful partial update', async () => {
      mockRepository.findById
        .mockResolvedValueOnce(createMenuRow())
        .mockResolvedValueOnce(createMenuRow({ menu_name: 'Mie Goreng' }));

      const result = await service.updateMenu(BUSINESS_ID, MENU_ID, {
        menu_name: 'Mie Goreng',
      });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
    });

    it('passes only provided fields to repository update', async () => {
      mockRepository.findById.mockResolvedValue(createMenuRow());

      await service.updateMenu(BUSINESS_ID, MENU_ID, { menu_name: 'Baru' });

      expect(mockRepository.update).toHaveBeenCalledWith(
        MENU_ID,
        expect.objectContaining({ menu_item_name: 'Baru' }),
      );
    });

    it('throws 400 VALIDATION_FAILED when no fields are provided and no file', async () => {
      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, {}),
      ).rejects.toMatchObject({
        code: ErrorCodes.ValidationFailed,
        status: 400,
      });

      expect(mockRepository.update).not.toHaveBeenCalled();
    });

    it('does not throw 400 when only file is provided (no body fields)', async () => {
      const file = createMulterFile();
      mockStorageService.uploadFile.mockResolvedValueOnce(createUploadResult());
      mockStorageService.getFile.mockResolvedValueOnce(createGetFileResult());
      mockRepository.findById.mockResolvedValue(
        createMenuRow({ blob_id: BLOB_ID }),
      );
      mockStorageService.updateFile.mockResolvedValueOnce(
        createUpdateFileResult(),
      );

      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, {}, file),
      ).resolves.not.toThrow();
    });

    it('validates new category belongs to the unit when menu_category_id is provided', async () => {
      mockRepository.findCategoryById.mockResolvedValueOnce(null);

      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, {
          menu_category_id: 'other-category-id',
        }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.MenuCategoryNotFound,
        status: 404,
      });
    });

    it('skips category validation when menu_category_id is not in dto', async () => {
      await service.updateMenu(BUSINESS_ID, MENU_ID, { menu_name: 'Baru' });

      expect(mockRepository.findCategoryById).not.toHaveBeenCalled();
    });

    it('throws 409 MENU_CONFLICT when new name already used by another menu in the unit', async () => {
      mockRepository.findByName.mockResolvedValueOnce({
        menu_item_id: 'different-menu-id',
      });

      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, { menu_name: 'Taken Name' }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.MenuConflict,
        status: 409,
        details: [
          expect.objectContaining({
            property: 'menu_name',
            constraints: expect.objectContaining({
              unique: 'Nama menu sudah digunakan di unit usaha ini',
            }),
          }),
        ],
      });
    });

    it('excludes self (current menuId) from name conflict check', async () => {
      await service.updateMenu(BUSINESS_ID, MENU_ID, {
        menu_name: 'Same Name',
      });

      expect(mockRepository.findByName).toHaveBeenCalledWith(
        'Same Name',
        BUSINESS_ID,
        MENU_ID,
      );
    });

    it('skips name conflict check when menu_name is not in dto', async () => {
      await service.updateMenu(BUSINESS_ID, MENU_ID, { item_price: 30000 });

      expect(mockRepository.findByName).not.toHaveBeenCalled();
    });

    it('calls updateFile when file provided and menu already has blob_id', async () => {
      const file = createMulterFile();
      const existingMenu = createMenuRow({ blob_id: BLOB_ID });
      mockRepository.findById
        .mockResolvedValueOnce(existingMenu)
        .mockResolvedValueOnce(existingMenu);
      mockStorageService.updateFile.mockResolvedValueOnce(
        createUpdateFileResult(),
      );
      mockStorageService.getFile.mockResolvedValueOnce(createGetFileResult());

      await service.updateMenu(BUSINESS_ID, MENU_ID, {}, file);

      expect(mockStorageService.updateFile).toHaveBeenCalledWith(
        BLOB_ID,
        expect.objectContaining({
          folder: `menus/${BUSINESS_ID}`,
        }),
      );
      expect(mockStorageService.uploadFile).not.toHaveBeenCalled();
    });

    it('calls uploadFile when file provided and menu has no blob_id', async () => {
      const file = createMulterFile();
      const existingMenu = createMenuRow({ blob_id: null });
      const NEW_BLOB_ID = 'new-blob-id';
      mockRepository.findById
        .mockResolvedValueOnce(existingMenu)
        .mockResolvedValueOnce(createMenuRow({ blob_id: NEW_BLOB_ID }));
      mockStorageService.uploadFile.mockResolvedValueOnce(
        createUploadResult(NEW_BLOB_ID),
      );
      mockStorageService.getFile.mockResolvedValueOnce(createGetFileResult());

      await service.updateMenu(BUSINESS_ID, MENU_ID, {}, file);

      expect(mockStorageService.uploadFile).toHaveBeenCalled();
      expect(mockStorageService.updateFile).not.toHaveBeenCalled();
    });

    it('updates blob_id in DB when a new file is uploaded (no prior blob)', async () => {
      const file = createMulterFile();
      const NEW_BLOB_ID = 'new-blob-id';
      mockRepository.findById
        .mockResolvedValueOnce(createMenuRow({ blob_id: null }))
        .mockResolvedValueOnce(createMenuRow({ blob_id: NEW_BLOB_ID }));
      mockStorageService.uploadFile.mockResolvedValueOnce(
        createUploadResult(NEW_BLOB_ID),
      );
      mockStorageService.getFile.mockResolvedValueOnce(createGetFileResult());

      await service.updateMenu(BUSINESS_ID, MENU_ID, {}, file);

      expect(mockRepository.update).toHaveBeenCalledWith(
        MENU_ID,
        expect.objectContaining({ blob_id: NEW_BLOB_ID }),
      );
    });

    it('does not set blob_id in DB update when file is only replaced via updateFile', async () => {
      const file = createMulterFile();
      const existingMenu = createMenuRow({ blob_id: BLOB_ID });
      mockRepository.findById
        .mockResolvedValueOnce(existingMenu)
        .mockResolvedValueOnce(existingMenu);
      mockStorageService.updateFile.mockResolvedValueOnce(
        createUpdateFileResult(),
      );
      mockStorageService.getFile.mockResolvedValueOnce(createGetFileResult());

      await service.updateMenu(BUSINESS_ID, MENU_ID, {}, file);

      expect(mockRepository.update).toHaveBeenCalledWith(
        MENU_ID,
        expect.not.objectContaining({ blob_id: expect.anything() }),
      );
    });

    it('compensates (deletes) new blob when DB update fails after uploadFile', async () => {
      const file = createMulterFile();
      const NEW_BLOB_ID = 'new-blob-id';
      mockRepository.findById.mockResolvedValue(
        createMenuRow({ blob_id: null }),
      );
      mockStorageService.uploadFile.mockResolvedValueOnce(
        createUploadResult(NEW_BLOB_ID),
      );
      mockStorageService.deleteFile.mockResolvedValueOnce(
        createDeleteFileResult(),
      );
      mockRepository.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, {}, file),
      ).rejects.toThrow();

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(NEW_BLOB_ID);
    });

    it('does not compensate storage when DB update fails but updateFile was used', async () => {
      const file = createMulterFile();
      mockRepository.findById.mockResolvedValue(
        createMenuRow({ blob_id: BLOB_ID }),
      );
      mockStorageService.updateFile.mockResolvedValueOnce(
        createUpdateFileResult(),
      );
      mockRepository.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, {}, file),
      ).rejects.toThrow();

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('throws 400 MENU_INVALID_IMAGE_TYPE when file is not an image', async () => {
      const file = createMulterFile({ mimetype: 'application/pdf' });

      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, { menu_name: 'Baru' }, file),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.MenuInvalidImageType,
        status: 400,
      });
    });

    it('throws 400 VALIDATION_FAILED when file exceeds max size', async () => {
      const oversizedFile = createMulterFile({ size: 10 * 1024 * 1024 });

      await expect(
        service.updateMenu(
          BUSINESS_ID,
          MENU_ID,
          { menu_name: 'Baru' },
          oversizedFile,
        ),
      ).rejects.toMatchObject({
        code: ErrorCodes.ValidationFailed,
        status: 400,
      });
    });

    it('throws 404 UNIT_NOT_FOUND when unit does not exist', async () => {
      mockRepository.findUnitById.mockResolvedValueOnce(null);

      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, { menu_name: 'X' }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UnitNotFound,
        status: 404,
      });
    });

    it('throws 404 MENU_NOT_FOUND when menu does not exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, { menu_name: 'X' }),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.MenuNotFound,
        status: 404,
      });
    });

    it('throws 500 on unexpected error', async () => {
      mockRepository.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, { menu_name: 'X' }),
      ).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });

    it('re-throws AppError without wrapping in 500', async () => {
      const appError = new AppError({
        code: DomainErrorCodes.MenuConflict,
        message: 'Conflict',
        status: 409,
      });
      mockRepository.findByName.mockRejectedValueOnce(appError);

      await expect(
        service.updateMenu(BUSINESS_ID, MENU_ID, { menu_name: 'X' }),
      ).rejects.toBe(appError);
    });
  });

  // ---------------------------------------------------------------------------
  // deleteMenu
  // ---------------------------------------------------------------------------

  describe('deleteMenu', () => {
    beforeEach(() => {
      mockRepository.findUnitById.mockResolvedValue({
        unit_id: BUSINESS_ID,
        unit_name: 'Restoran A',
      });
      mockRepository.findById.mockResolvedValue(createMenuRow());
      mockRepository.softDelete.mockResolvedValue();
    });

    it('returns 200 on successful delete (menu without image)', async () => {
      const result = await service.deleteMenu(BUSINESS_ID, MENU_ID);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(MENU_ID);
    });

    it('deletes file from storage when menu has blob_id', async () => {
      mockRepository.findById.mockResolvedValue(
        createMenuRow({ blob_id: BLOB_ID }),
      );
      mockStorageService.deleteFile.mockResolvedValueOnce(
        createDeleteFileResult(),
      );

      await service.deleteMenu(BUSINESS_ID, MENU_ID);

      expect(mockStorageService.deleteFile).toHaveBeenCalledWith(BLOB_ID);
    });

    it('does not attempt storage delete when menu has no blob_id', async () => {
      mockRepository.findById.mockResolvedValue(
        createMenuRow({ blob_id: null }),
      );

      await service.deleteMenu(BUSINESS_ID, MENU_ID);

      expect(mockStorageService.deleteFile).not.toHaveBeenCalled();
    });

    it('rolls back soft delete when storage delete fails', async () => {
      mockRepository.findById.mockResolvedValue(
        createMenuRow({ blob_id: BLOB_ID }),
      );
      mockStorageService.deleteFile.mockRejectedValueOnce(
        new Error('Storage error'),
      );
      mockRepository.undoSoftDelete.mockResolvedValueOnce();

      await expect(service.deleteMenu(BUSINESS_ID, MENU_ID)).rejects.toThrow();

      expect(mockRepository.undoSoftDelete).toHaveBeenCalledWith(MENU_ID);
    });

    it('logs error and re-throws when storage delete fails (even after rollback)', async () => {
      mockRepository.findById.mockResolvedValue(
        createMenuRow({ blob_id: BLOB_ID }),
      );
      mockStorageService.deleteFile.mockRejectedValueOnce(
        new Error('Storage error'),
      );
      mockRepository.undoSoftDelete.mockResolvedValueOnce();

      await expect(service.deleteMenu(BUSINESS_ID, MENU_ID)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ menuId: MENU_ID }),
        expect.stringContaining('rolling back'),
      );
    });

    it('logs critical error when both storage delete and DB rollback fail', async () => {
      mockRepository.findById.mockResolvedValue(
        createMenuRow({ blob_id: BLOB_ID }),
      );
      mockStorageService.deleteFile.mockRejectedValueOnce(
        new Error('Storage error'),
      );
      mockRepository.undoSoftDelete.mockRejectedValueOnce(
        new Error('Rollback DB error'),
      );

      await expect(service.deleteMenu(BUSINESS_ID, MENU_ID)).rejects.toThrow();

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.objectContaining({ menuId: MENU_ID }),
        expect.stringContaining('DB rollback failed'),
      );
    });

    it('throws 404 UNIT_NOT_FOUND when unit does not exist', async () => {
      mockRepository.findUnitById.mockResolvedValueOnce(null);

      await expect(
        service.deleteMenu(BUSINESS_ID, MENU_ID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UnitNotFound,
        status: 404,
      });

      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('throws 404 MENU_NOT_FOUND when menu does not exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.deleteMenu(BUSINESS_ID, MENU_ID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.MenuNotFound,
        status: 404,
      });

      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('throws 500 on unexpected error', async () => {
      mockRepository.softDelete.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.deleteMenu(BUSINESS_ID, MENU_ID),
      ).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });

    it('re-throws AppError without wrapping in 500', async () => {
      const appError = new AppError({
        code: DomainErrorCodes.MenuNotFound,
        message: 'Menu not found',
        status: 404,
      });
      mockRepository.findById.mockRejectedValueOnce(appError);

      await expect(service.deleteMenu(BUSINESS_ID, MENU_ID)).rejects.toBe(
        appError,
      );
    });
  });
});
