import bcrypt from 'bcrypt';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import type { CreateUserDto } from './dto/create-user.dto';
import type { ListUsersQueryDto } from './dto/list-users-query.dto';
import type { UpdateUserDto } from './dto/update-user.dto';
import {
  roleNotFoundError,
  unitNotFoundForUserError,
  userConflictError,
  userEmailConflictError,
  userNotFoundError,
  userSelfDeactivateError,
  userSelfDeleteError,
  userUsernameConflictError,
} from './errors/user.errors';
import type {
  UserCreateResponse,
  UserDeleteResponse,
  UserDetailResponse,
  UserListResponse,
  UserResponse,
  UserStatsResponse,
  UserWithDetails,
} from './models/user.model';
import type {
  IUserRepository,
  SortByColumn,
} from './repositories/user.repository';

export class UserService {
  constructor(
    private readonly repository: IUserRepository,
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {}

  private static readonly PG_UNIQUE_VIOLATION = '23505';

  async listUsers(query: ListUsersQueryDto): Promise<UserListResponse> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const sortBy = (query.sortBy as SortByColumn | undefined) ?? 'full_name';
      const sortType = query.sortType ?? 'ASC';
      const search =
        query.search && query.search.trim().length > 0
          ? query.search.trim()
          : undefined;

      this.logger.info(
        { page, limit, search, sortBy, sortType },
        'Fetching users list',
      );

      const { data, total } = await this.repository.findAll({
        page,
        limit,
        search,
        sortBy,
        sortType,
      });

      const totalPages = Math.ceil(total / limit);

      this.logger.info(
        { total, page, limit },
        'Users list fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Data pengguna berhasil diambil',
        data: data.map((u) => this.mapToResponse(u)),
        meta: { page, limit, total, totalPages },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error },
        'Unexpected error while fetching users list',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getUserStats(): Promise<UserStatsResponse> {
    try {
      this.logger.info('Fetching user stats');

      const stats = await this.repository.getStats();

      this.logger.info({ stats }, 'User stats fetched successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Statistik pengguna berhasil diambil',
        data: stats,
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error },
        'Unexpected error while fetching user stats',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async createUser(dto: CreateUserDto): Promise<UserCreateResponse> {
    try {
      this.logger.info(
        { username: dto.user_name, email: dto.email },
        'Creating user',
      );

      const [existingUsername, existingEmail, role, unit] = await Promise.all([
        this.repository.findByUsername(dto.user_name),
        this.repository.findByEmail(dto.email),
        this.repository.findRoleById(dto.role_id),
        this.repository.findUnitById(dto.business_unit_id),
      ]);

      if (existingUsername) {
        this.logger.warn(
          { username: dto.user_name },
          'User creation failed - username already exists',
        );
        throw userUsernameConflictError();
      }

      if (existingEmail) {
        this.logger.warn(
          { email: dto.email },
          'User creation failed - email already exists',
        );
        throw userEmailConflictError();
      }

      if (!role) {
        this.logger.warn(
          { roleId: dto.role_id },
          'User creation failed - role not found',
        );
        throw roleNotFoundError();
      }

      if (!unit) {
        this.logger.warn(
          { unitId: dto.business_unit_id },
          'User creation failed - business unit not found',
        );
        throw unitNotFoundForUserError();
      }

      const hashedPassword = await bcrypt.hash(
        dto.password,
        this.config.bcryptSaltRounds,
      );

      const { user_id, username } = await this.repository.createWithUnit(
        {
          role_id: dto.role_id,
          full_name: dto.full_name,
          username: dto.user_name,
          email: dto.email,
          password: hashedPassword,
          is_active: true,
          must_change_password: true,
        },
        dto.business_unit_id,
      );

      this.logger.info({ userId: user_id }, 'User created successfully');

      return {
        success: true,
        statusCode: 201,
        message: 'Pengguna berhasil dibuat',
        data: {
          user_id,
          user_name: username,
          password: dto.password,
        },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      const conflictError = this.mapDatabaseConflictError(error);
      if (conflictError) {
        throw conflictError;
      }

      this.logger.error({ err: error }, 'Unexpected error while creating user');

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getUserById(id: string): Promise<UserDetailResponse> {
    try {
      this.logger.info({ userId: id }, 'Fetching user by ID');

      const user = await this.repository.findById(id);

      if (!user) {
        this.logger.warn({ userId: id }, 'User not found');
        throw userNotFoundError();
      }

      this.logger.info({ userId: id }, 'User fetched successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Detail pengguna berhasil diambil',
        data: this.mapToResponse(user),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error, userId: id },
        'Unexpected error while fetching user',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async updateUser(
    id: string,
    dto: UpdateUserDto,
    requestUserId: string,
  ): Promise<UserDetailResponse> {
    try {
      this.logger.info({ userId: id }, 'Updating user');

      const hasAnyField =
        dto.full_name !== undefined ||
        dto.user_name !== undefined ||
        dto.email !== undefined ||
        dto.role_id !== undefined ||
        dto.business_unit_id !== undefined ||
        dto.status !== undefined;

      if (!hasAnyField) {
        throw new AppError({
          code: ErrorCodes.ValidationFailed,
          message: 'Minimal satu field harus diisi untuk melakukan pembaruan',
          status: 400,
        });
      }

      const existing = await this.repository.findById(id);

      if (!existing) {
        this.logger.warn({ userId: id }, 'User not found for update');
        throw userNotFoundError();
      }

      if (id === requestUserId && dto.status === 'inactive') {
        throw userSelfDeactivateError();
      }

      const validationPromises: Promise<void>[] = [];

      if (dto.user_name !== undefined) {
        validationPromises.push(
          this.repository.findByUsername(dto.user_name, id).then((found) => {
            if (found) throw userUsernameConflictError();
          }),
        );
      }

      if (dto.email !== undefined) {
        validationPromises.push(
          this.repository.findByEmail(dto.email, id).then((found) => {
            if (found) throw userEmailConflictError();
          }),
        );
      }

      if (dto.role_id !== undefined) {
        validationPromises.push(
          this.repository.findRoleById(dto.role_id).then((found) => {
            if (!found) throw roleNotFoundError();
          }),
        );
      }

      if (dto.business_unit_id !== undefined) {
        validationPromises.push(
          this.repository.findUnitById(dto.business_unit_id).then((found) => {
            if (!found) throw unitNotFoundForUserError();
          }),
        );
      }

      if (validationPromises.length > 0) {
        await Promise.all(validationPromises);
      }

      const updateData: {
        full_name?: string;
        username?: string;
        email?: string;
        role_id?: string;
        is_active?: boolean;
      } = {};

      if (dto.full_name !== undefined) updateData.full_name = dto.full_name;
      if (dto.user_name !== undefined) updateData.username = dto.user_name;
      if (dto.email !== undefined) updateData.email = dto.email;
      if (dto.role_id !== undefined) updateData.role_id = dto.role_id;
      if (dto.status !== undefined)
        updateData.is_active = dto.status === 'active';

      if (Object.keys(updateData).length > 0) {
        await this.repository.update(id, updateData);
      }

      if (dto.business_unit_id !== undefined) {
        const activeUnits = await this.repository.findActiveUserUnits(id);
        const currentUnitIds = activeUnits.map((u) => u.unit_id);

        if (!currentUnitIds.includes(dto.business_unit_id)) {
          if (activeUnits.length > 0) {
            await this.repository.replaceUserUnit(id, dto.business_unit_id);
          } else {
            await this.repository.createUserUnit(id, dto.business_unit_id);
          }
        }
      }

      const updatedUser = await this.repository.findById(id);

      this.logger.info({ userId: id }, 'User updated successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Pengguna berhasil diperbarui',
        data: this.mapToResponse(updatedUser!),
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      const conflictError = this.mapDatabaseConflictError(error);
      if (conflictError) {
        throw conflictError;
      }

      this.logger.error(
        { err: error, userId: id },
        'Unexpected error while updating user',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async deleteUser(
    id: string,
    requestUserId: string,
  ): Promise<UserDeleteResponse> {
    try {
      this.logger.info({ userId: id }, 'Deleting user');

      if (id === requestUserId) {
        throw userSelfDeleteError();
      }

      const existing = await this.repository.findById(id);

      if (!existing) {
        this.logger.warn({ userId: id }, 'User not found for deletion');
        throw userNotFoundError();
      }

      await Promise.all([
        this.repository.softDelete(id),
        this.repository.softDeleteUserUnits(id),
      ]);

      this.logger.info({ userId: id }, 'User deleted successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Pengguna berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error, userId: id },
        'Unexpected error while deleting user',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  private mapToResponse(user: UserWithDetails): UserResponse {
    return {
      user_id: user.user_id,
      full_name: user.full_name,
      user_name: user.username,
      email: user.email,
      role_id: user.role_id,
      role_name: user.role_name,
      role_code: user.role_code,
      status: user.is_active ? 'active' : 'inactive',
      last_login: user.last_login_at,
      business_units: user.business_units,
    };
  }

  private mapDatabaseConflictError(error: unknown): AppError | null {
    const pgError = error as {
      code?: string;
      constraint?: string;
      detail?: string;
      message?: string;
    };

    if (pgError?.code !== UserService.PG_UNIQUE_VIOLATION) {
      return null;
    }

    const loweredContext =
      `${pgError.constraint ?? ''} ${pgError.detail ?? ''} ${pgError.message ?? ''}`.toLowerCase();
    if (loweredContext.includes('username')) {
      return userUsernameConflictError();
    }

    if (loweredContext.includes('email')) {
      return userEmailConflictError();
    }

    return userConflictError();
  }
}
