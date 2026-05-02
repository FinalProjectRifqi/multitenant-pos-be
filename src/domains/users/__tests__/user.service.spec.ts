import type { Logger } from 'pino';
import { AppError } from '../../../common/errors/app-error';
import { ErrorCodes } from '../../../common/errors/error-codes';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';
import type { AppConfig } from '../../../config';
import { UserService } from '../user.service';
import type { UserStats, UserWithDetails } from '../models/user.model';
import type { IUserRepository } from '../repositories/user.repository';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const VALID_UUID_2 = '660e8400-e29b-41d4-a716-446655440001';
const REQUEST_USER_ID = 'aabbccdd-0000-0000-0000-000000000001';

jest.mock('bcrypt', () => ({
  hash: jest.fn().mockResolvedValue('hashed-password'),
}));

const createMockRepository = (): jest.Mocked<IUserRepository> => ({
  findAll: jest.fn(),
  findById: jest.fn(),
  getStats: jest.fn(),
  findByUsername: jest.fn(),
  findByEmail: jest.fn(),
  findRoleById: jest.fn(),
  findUnitById: jest.fn(),
  findActiveUserUnits: jest.fn(),
  create: jest.fn(),
  createUserUnit: jest.fn(),
  update: jest.fn(),
  revokeUserUnits: jest.fn(),
  softDelete: jest.fn(),
  softDeleteUserUnits: jest.fn(),
});

const createMockLogger = (): jest.Mocked<Logger> =>
  ({
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  }) as unknown as jest.Mocked<Logger>;

const createMockConfig = (): AppConfig =>
  ({
    bcryptSaltRounds: 10,
  }) as unknown as AppConfig;

const createUserWithDetails = (
  overrides?: Partial<UserWithDetails>,
): UserWithDetails => ({
  user_id: VALID_UUID,
  full_name: 'Budi Santoso',
  username: 'budi.santoso',
  email: 'budi@example.com',
  is_active: true,
  last_login_at: new Date(),
  role_id: VALID_UUID_2,
  role_name: 'Kasir',
  business_units: [
    { business_unit_id: VALID_UUID, business_unit_name: 'Toko A' },
  ],
  ...overrides,
});

describe('UserService', () => {
  let service: UserService;
  let mockRepository: jest.Mocked<IUserRepository>;
  let mockLogger: jest.Mocked<Logger>;
  let mockConfig: AppConfig;

  beforeEach(() => {
    mockRepository = createMockRepository();
    mockLogger = createMockLogger();
    mockConfig = createMockConfig();
    service = new UserService(mockRepository, mockConfig, mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // ---------------------------------------------------------------------------
  // listUsers
  // ---------------------------------------------------------------------------

  describe('listUsers', () => {
    it('returns paginated list with correct meta', async () => {
      const user = createUserWithDetails();
      mockRepository.findAll.mockResolvedValueOnce({ data: [user], total: 1 });

      const result = await service.listUsers({ page: 1, limit: 10 });

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].user_name).toBe('budi.santoso');
      expect(result.meta).toEqual({ page: 1, limit: 10, total: 1, totalPages: 1 });
    });

    it('uses defaults page=1, limit=10, sortBy=full_name, sortType=ASC when not provided', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listUsers({});

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          page: 1,
          limit: 10,
          sortBy: 'full_name',
          sortType: 'ASC',
        }),
      );
    });

    it('passes search string when provided', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listUsers({ search: 'budi' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: 'budi' }),
      );
    });

    it('normalizes empty search string to undefined', async () => {
      mockRepository.findAll.mockResolvedValueOnce({ data: [], total: 0 });

      await service.listUsers({ search: '   ' });

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({ search: undefined }),
      );
    });

    it('maps is_active to status string in response', async () => {
      const inactiveUser = createUserWithDetails({ is_active: false });
      mockRepository.findAll.mockResolvedValueOnce({ data: [inactiveUser], total: 1 });

      const result = await service.listUsers({});

      expect(result.data[0].status).toBe('inactive');
    });

    it('throws 500 on unexpected repository error', async () => {
      mockRepository.findAll.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.listUsers({})).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getUserStats
  // ---------------------------------------------------------------------------

  describe('getUserStats', () => {
    it('returns stats object with correct counts', async () => {
      const stats: UserStats = {
        total_users: 30,
        users_active: 25,
        users_inactive: 5,
      };
      mockRepository.getStats.mockResolvedValueOnce(stats);

      const result = await service.getUserStats();

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(result.data).toEqual(stats);
    });

    it('throws 500 on unexpected repository error', async () => {
      mockRepository.getStats.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.getUserStats()).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // createUser
  // ---------------------------------------------------------------------------

  describe('createUser', () => {
    const validDto = {
      full_name: 'Budi Santoso',
      user_name: 'budi.santoso',
      email: 'budi@example.com',
      role_id: VALID_UUID_2,
      business_unit_id: VALID_UUID,
      password: 'password123',
    };

    beforeEach(() => {
      mockRepository.findByUsername.mockResolvedValue(null);
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findRoleById.mockResolvedValue({ role_id: VALID_UUID_2 });
      mockRepository.findUnitById.mockResolvedValue({ unit_id: VALID_UUID });
      mockRepository.create.mockResolvedValue({
        user_id: VALID_UUID,
        username: 'budi.santoso',
      });
      mockRepository.createUserUnit.mockResolvedValue();
    });

    it('returns 201 with user_id, user_name, and plain-text password on success', async () => {
      const result = await service.createUser(validDto);

      expect(result.statusCode).toBe(201);
      expect(result.data.user_id).toBe(VALID_UUID);
      expect(result.data.user_name).toBe('budi.santoso');
      expect(result.data.password).toBe('password123');
    });

    it('stores hashed password, not plain text', async () => {
      await service.createUser(validDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ password: 'hashed-password' }),
      );
    });

    it('sets is_active=true and must_change_password=true on create', async () => {
      await service.createUser(validDto);

      expect(mockRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({ is_active: true, must_change_password: true }),
      );
    });

    it('throws 409 USER_USERNAME_CONFLICT when username already exists', async () => {
      mockRepository.findByUsername.mockResolvedValueOnce({ user_id: VALID_UUID });

      await expect(service.createUser(validDto)).rejects.toMatchObject({
        code: DomainErrorCodes.UserUsernameConflict,
        status: 409,
      });
    });

    it('throws 409 USER_EMAIL_CONFLICT when email already exists', async () => {
      mockRepository.findByEmail.mockResolvedValueOnce({ user_id: VALID_UUID });

      await expect(service.createUser(validDto)).rejects.toMatchObject({
        code: DomainErrorCodes.UserEmailConflict,
        status: 409,
      });
    });

    it('throws 404 ROLE_NOT_FOUND when role does not exist', async () => {
      mockRepository.findRoleById.mockResolvedValueOnce(null);

      await expect(service.createUser(validDto)).rejects.toMatchObject({
        code: DomainErrorCodes.RoleNotFound,
        status: 404,
      });
    });

    it('throws 404 UNIT_NOT_FOUND when business unit does not exist', async () => {
      mockRepository.findUnitById.mockResolvedValueOnce(null);

      await expect(service.createUser(validDto)).rejects.toMatchObject({
        code: DomainErrorCodes.UnitNotFound,
        status: 404,
      });
    });

    it('calls createUserUnit after creating user', async () => {
      await service.createUser(validDto);

      expect(mockRepository.createUserUnit).toHaveBeenCalledWith(
        VALID_UUID,
        VALID_UUID,
      );
    });

    it('throws 500 on unexpected error', async () => {
      mockRepository.create.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.createUser(validDto)).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // getUserById
  // ---------------------------------------------------------------------------

  describe('getUserById', () => {
    it('returns 200 with user data when found', async () => {
      const user = createUserWithDetails();
      mockRepository.findById.mockResolvedValueOnce(user);

      const result = await service.getUserById(VALID_UUID);

      expect(result.statusCode).toBe(200);
      expect(result.data.user_id).toBe(VALID_UUID);
      expect(result.data.business_units).toHaveLength(1);
    });

    it('throws 404 USER_NOT_FOUND when user does not exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(service.getUserById(VALID_UUID)).rejects.toMatchObject({
        code: DomainErrorCodes.UserNotFound,
        status: 404,
      });
    });

    it('throws 500 on unexpected error', async () => {
      mockRepository.findById.mockRejectedValueOnce(new Error('DB error'));

      await expect(service.getUserById(VALID_UUID)).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // updateUser
  // ---------------------------------------------------------------------------

  describe('updateUser', () => {
    const existingUser = createUserWithDetails();

    beforeEach(() => {
      mockRepository.findById.mockResolvedValue(existingUser);
      mockRepository.findByUsername.mockResolvedValue(null);
      mockRepository.findByEmail.mockResolvedValue(null);
      mockRepository.findRoleById.mockResolvedValue({ role_id: VALID_UUID_2 });
      mockRepository.findUnitById.mockResolvedValue({ unit_id: VALID_UUID });
      mockRepository.update.mockResolvedValue();
      mockRepository.findActiveUserUnits.mockResolvedValue([{ unit_id: VALID_UUID }]);
    });

    it('returns 200 on successful partial update', async () => {
      const result = await service.updateUser(
        VALID_UUID,
        { full_name: 'Nama Baru' },
        REQUEST_USER_ID,
      );

      expect(result.statusCode).toBe(200);
      expect(mockRepository.update).toHaveBeenCalledWith(
        VALID_UUID,
        expect.objectContaining({ full_name: 'Nama Baru' }),
      );
    });

    it('throws 400 VALIDATION_FAILED when body is empty', async () => {
      await expect(
        service.updateUser(VALID_UUID, {}, REQUEST_USER_ID),
      ).rejects.toMatchObject({
        code: ErrorCodes.ValidationFailed,
        status: 400,
      });
      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('throws 404 USER_NOT_FOUND when user does not exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.updateUser(VALID_UUID, { full_name: 'X' }, REQUEST_USER_ID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UserNotFound,
        status: 404,
      });
    });

    it('throws 400 USER_SELF_DEACTIVATE when user deactivates themselves', async () => {
      await expect(
        service.updateUser(VALID_UUID, { status: 'inactive' }, VALID_UUID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UserSelfDeactivate,
        status: 400,
      });
    });

    it('allows self-update with non-status fields', async () => {
      const result = await service.updateUser(
        VALID_UUID,
        { full_name: 'Baru' },
        VALID_UUID,
      );

      expect(result.statusCode).toBe(200);
    });

    it('throws 409 USER_USERNAME_CONFLICT when new username is taken by another user', async () => {
      mockRepository.findByUsername.mockResolvedValueOnce({ user_id: VALID_UUID_2 });

      await expect(
        service.updateUser(VALID_UUID, { user_name: 'taken' }, REQUEST_USER_ID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UserUsernameConflict,
        status: 409,
      });
    });

    it('does not trigger conflict when username is same as current user', async () => {
      mockRepository.findByUsername.mockResolvedValueOnce(null);

      const result = await service.updateUser(
        VALID_UUID,
        { user_name: 'budi.santoso' },
        REQUEST_USER_ID,
      );

      expect(result.statusCode).toBe(200);
    });

    it('revokes old unit and creates new when business_unit_id changes', async () => {
      mockRepository.findActiveUserUnits.mockResolvedValueOnce([{ unit_id: VALID_UUID }]);

      await service.updateUser(
        VALID_UUID,
        { business_unit_id: VALID_UUID_2 },
        REQUEST_USER_ID,
      );

      expect(mockRepository.revokeUserUnits).toHaveBeenCalledWith(VALID_UUID);
      expect(mockRepository.createUserUnit).toHaveBeenCalledWith(
        VALID_UUID,
        VALID_UUID_2,
      );
    });

    it('skips revoke/create when business_unit_id is same as current active unit', async () => {
      mockRepository.findActiveUserUnits.mockResolvedValueOnce([{ unit_id: VALID_UUID }]);

      await service.updateUser(
        VALID_UUID,
        { business_unit_id: VALID_UUID },
        REQUEST_USER_ID,
      );

      expect(mockRepository.revokeUserUnits).not.toHaveBeenCalled();
      expect(mockRepository.createUserUnit).not.toHaveBeenCalled();
    });

    it('creates unit without revoking when user has no active units', async () => {
      mockRepository.findActiveUserUnits.mockResolvedValueOnce([]);

      await service.updateUser(
        VALID_UUID,
        { business_unit_id: VALID_UUID_2 },
        REQUEST_USER_ID,
      );

      expect(mockRepository.revokeUserUnits).not.toHaveBeenCalled();
      expect(mockRepository.createUserUnit).toHaveBeenCalledWith(
        VALID_UUID,
        VALID_UUID_2,
      );
    });

    it('throws 500 on unexpected error', async () => {
      mockRepository.update.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.updateUser(VALID_UUID, { full_name: 'X' }, REQUEST_USER_ID),
      ).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });

  // ---------------------------------------------------------------------------
  // deleteUser
  // ---------------------------------------------------------------------------

  describe('deleteUser', () => {
    it('returns 200 on successful delete', async () => {
      const user = createUserWithDetails();
      mockRepository.findById.mockResolvedValueOnce(user);
      mockRepository.softDelete.mockResolvedValueOnce();
      mockRepository.softDeleteUserUnits.mockResolvedValueOnce();

      const result = await service.deleteUser(VALID_UUID, REQUEST_USER_ID);

      expect(result.success).toBe(true);
      expect(result.statusCode).toBe(200);
      expect(mockRepository.softDelete).toHaveBeenCalledWith(VALID_UUID);
      expect(mockRepository.softDeleteUserUnits).toHaveBeenCalledWith(VALID_UUID);
    });

    it('throws 400 USER_SELF_DELETE when user tries to delete themselves', async () => {
      await expect(
        service.deleteUser(VALID_UUID, VALID_UUID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UserSelfDelete,
        status: 400,
      });

      expect(mockRepository.findById).not.toHaveBeenCalled();
    });

    it('throws 404 USER_NOT_FOUND when user does not exist', async () => {
      mockRepository.findById.mockResolvedValueOnce(null);

      await expect(
        service.deleteUser(VALID_UUID, REQUEST_USER_ID),
      ).rejects.toMatchObject({
        code: DomainErrorCodes.UserNotFound,
        status: 404,
      });

      expect(mockRepository.softDelete).not.toHaveBeenCalled();
    });

    it('re-throws AppError without wrapping', async () => {
      const user = createUserWithDetails();
      mockRepository.findById.mockResolvedValueOnce(user);

      const appError = new AppError({
        code: ErrorCodes.Internal,
        message: 'DB fail',
        status: 500,
      });
      mockRepository.softDelete.mockRejectedValueOnce(appError);

      await expect(
        service.deleteUser(VALID_UUID, REQUEST_USER_ID),
      ).rejects.toBe(appError);
    });

    it('throws 500 on unexpected error', async () => {
      mockRepository.findById.mockRejectedValueOnce(new Error('DB error'));

      await expect(
        service.deleteUser(VALID_UUID, REQUEST_USER_ID),
      ).rejects.toMatchObject({
        code: ErrorCodes.Internal,
        status: 500,
      });
    });
  });
});
