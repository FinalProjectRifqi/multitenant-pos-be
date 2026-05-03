import type { Logger } from 'pino';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { ListRoleQueryDto } from './dto/list-role-query.dto';
import type { Role, RoleListResponse, RoleResponse } from './models/role.model';
import type { IRoleRepository } from './repositories/role.repository';

export class RoleService {
  constructor(
    private readonly repository: IRoleRepository,
    private readonly logger: Logger,
  ) {}

  async listRoles(query: ListRoleQueryDto): Promise<RoleListResponse> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const search =
        query.search && query.search.length > 0 ? query.search : undefined;

      this.logger.info({ page, limit, search }, 'Fetching roles list');
      const { data, total } = await this.repository.findAll({
        page,
        limit,
        search,
      });

      const totalPages = Math.ceil(total / limit);

      this.logger.info(
        { total, page, limit },
        'Roles list fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Data role berhasil diambil',
        data: data.map((role) => this.mapToResponse(role)),
        meta: { page, limit, total, totalPages },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error },
        'Unexpected error while fetching roles list',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Failed to list roles',
        status: 500,
      });
    }
  }

  private mapToResponse(unit: Role): RoleResponse {
    return {
      role_id: unit.role_id,
      role_name: unit.role_name,
    };
  }
}
