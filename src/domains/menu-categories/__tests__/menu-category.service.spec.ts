import type { Logger } from 'pino';
import { ErrorCodes } from '../../../common/errors/error-codes';
import { IMenuCategoryRepository } from '../repositories/menu-category.repository';
import { MenuCategory } from '../models/menu-category.model';
import { MenuCategoryService } from '../menu-category.service';

const VALID_UUID = '';

const createMockRepository = (): jest.Mocked<IMenuCategoryRepository> => ({
  findAll: jest.fn(),
});

const createMockLogger = (): jest.Mocked<Logger> =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<Logger>;

const createMenuCategory = (
  overrides?: Partial<MenuCategory>,
): MenuCategory => ({
  menu_category_id: VALID_UUID,
  category_name: 'Makanan',
  description: 'Deskripsi Makanan',
  business_unit_id: 'c291c827-f3dc-491e-8611-4b1f1484341f',
  business_unit_name: 'Unit 1',
  is_active: true,
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  ...overrides,
});

describe('MenuCategoryService', () => {
  let service: MenuCategoryService;
  let mockRepository: jest.Mocked<IMenuCategoryRepository>;
  let mockLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    service = new MenuCategoryService(mockRepository, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // listMenuCategories
  // ---------------------------------------------------------------------------

  describe('listMenuCategories', () => {
    it('returns paginated list with correct meta when data exists', async () => {
      const menuCategory = createMenuCategory();
      mockRepository.findAll.mockResolvedValueOnce({
        data: [menuCategory],
        total: 1,
      });

      const result = await service.listMenuCategories({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].menu_category_id).toBe(VALID_UUID);
      expect(result.meta).toEqual({
        page: 1,
        limit: 10,
        total: 1,
        totalPages: 1,
      });
    });

    it('uses defaults of page=1, limit=10 when not provided', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listMenuCategories({});

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ page: 1, limit: 10 }),
      );
    });

    it('throws 500 when repository throws unexpected error', async () => {
      mockRepository.findAll.mockRejectedValueOnce(
        new Error('DB connection lost'),
      );

      await expect(service.listMenuCategories({})).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });
});
