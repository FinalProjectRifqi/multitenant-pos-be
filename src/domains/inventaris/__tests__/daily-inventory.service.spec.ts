import type { Logger } from 'pino';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import { InventarisService } from '../inventaris.service';
import type {
  DailyInventoryPlan,
  DailyInventoryRealization,
  InventoryItemWithUnit,
} from '../models/inventaris.model';
import type { IInventarisRepository } from '../repositories/inventaris.repository';

const UNIT_ID = '550e8400-e29b-41d4-a716-446655440000';
const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const INVENTORY_ITEM_ID = '550e8400-e29b-41d4-a716-446655440002';
const PLAN_ID = '550e8400-e29b-41d4-a716-446655440003';
const REALIZATION_ID = '550e8400-e29b-41d4-a716-446655440004';

const createMockLogger = (): jest.Mocked<Logger> =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<Logger>;

const createMockRepository = (): jest.Mocked<IInventarisRepository> =>
  ({
    findUnitById: jest.fn(),
    findById: jest.fn(),
    findDailyPlanByDateAndItem: jest.fn(),
    findRealizationByPlanId: jest.fn(),
    createDailyPlan: jest.fn(),
    createDailyRealization: jest.fn(),
    findDailyPlans: jest.fn(),
    updateDailyPlan: jest.fn(),
    deleteDailyPlan: jest.fn(),
    findDailyRealizations: jest.fn(),
    findDailyRealizationById: jest.fn(),
    getDailyUsageReport: jest.fn(),
    getVarianceReport: jest.fn(),
  }) as unknown as jest.Mocked<IInventarisRepository>;

const createInventoryItem = (
  overrides?: Partial<InventoryItemWithUnit>,
): InventoryItemWithUnit => ({
  inventory_item_id: INVENTORY_ITEM_ID,
  inventory_item_name: 'Beras',
  description: 'Beras premium',
  unit_of_measure: 'kg',
  current_stock: 100,
  min_threshold: 10,
  max_threshold: 200,
  last_restocked_at: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
  unit_id: UNIT_ID,
  ...overrides,
});

const createPlan = (
  overrides?: Partial<DailyInventoryPlan>,
): DailyInventoryPlan => ({
  daily_inventory_plan_id: PLAN_ID,
  unit_id: UNIT_ID,
  date: '2026-05-16',
  inventory_item_id: INVENTORY_ITEM_ID,
  inventory_item_name: 'Beras',
  planned_usage_qty: 20,
  unit: 'kg',
  notes: null,
  created_by: USER_ID,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

const createRealization = (
  overrides?: Partial<DailyInventoryRealization>,
): DailyInventoryRealization => ({
  daily_inventory_realization_id: REALIZATION_ID,
  unit_id: UNIT_ID,
  date: '2026-05-16',
  inventory_item_id: INVENTORY_ITEM_ID,
  inventory_item_name: 'Beras',
  daily_inventory_plan_id: PLAN_ID,
  planned_usage_qty: 20,
  actual_usage_qty: 17,
  waste_qty: 2,
  remaining_qty: null,
  variance_qty: 1,
  notes: null,
  status: 'SUBMITTED',
  submitted_by: USER_ID,
  submitted_at: new Date(),
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

describe('InventarisService daily inventory flow', () => {
  let repository: jest.Mocked<IInventarisRepository>;
  let service: InventarisService;

  beforeEach(() => {
    repository = createMockRepository();
    service = new InventarisService(repository, createMockLogger());
    repository.findUnitById.mockResolvedValue({ unit_id: UNIT_ID });
  });

  it('creates a daily plan without changing inventory stock', async () => {
    repository.findById.mockResolvedValue(createInventoryItem());
    repository.findDailyPlanByDateAndItem.mockResolvedValue(null);
    repository.createDailyPlan.mockResolvedValue(createPlan());

    const result = await service.createDailyPlan(UNIT_ID, USER_ID, {
      date: '2026-05-16',
      inventory_item_id: INVENTORY_ITEM_ID,
      planned_usage_qty: 20,
      unit: 'kg',
    });

    expect(result.statusCode).toBe(201);
    expect(repository.createDailyPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        planned_usage_qty: 20,
        unit: 'kg',
      }),
    );
    expect(repository.createTransaction).toBeUndefined();
  });

  it('rejects daily plan when submitted unit differs from inventory unit', async () => {
    repository.findById.mockResolvedValue(
      createInventoryItem({ unit_of_measure: 'liter' }),
    );

    await expect(
      service.createDailyPlan(UNIT_ID, USER_ID, {
        date: '2026-05-16',
        inventory_item_id: INVENTORY_ITEM_ID,
        planned_usage_qty: 20,
        unit: 'kg',
      }),
    ).rejects.toMatchObject({
      code: DomainErrorCodes.InventoryUnitMismatch,
    });
  });

  it('submits realization through repository transaction and returns variance', async () => {
    repository.findDailyPlanByDateAndItem.mockResolvedValue(createPlan());
    repository.createDailyRealization.mockResolvedValue(createRealization());

    const result = await service.submitDailyRealization(UNIT_ID, USER_ID, {
      date: '2026-05-16',
      inventory_item_id: INVENTORY_ITEM_ID,
      actual_usage_qty: 17,
      waste_qty: 2,
    });

    expect(result.data.variance_qty).toBe(1);
    expect(repository.createDailyRealization).toHaveBeenCalledWith(
      expect.objectContaining({
        actual_usage_qty: 17,
        waste_qty: 2,
        submitted_by: USER_ID,
      }),
    );
  });

  it('rejects realization when no matching daily plan exists', async () => {
    repository.findDailyPlanByDateAndItem.mockResolvedValue(null);

    await expect(
      service.submitDailyRealization(UNIT_ID, USER_ID, {
        date: '2026-05-16',
        inventory_item_id: INVENTORY_ITEM_ID,
        actual_usage_qty: 17,
      }),
    ).rejects.toMatchObject({
      code: DomainErrorCodes.DailyInventoryPlanNotFound,
    });
  });
});
