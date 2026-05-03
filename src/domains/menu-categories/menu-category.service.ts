import { Logger } from 'pino';
import { IMenuCategoryRepository } from './repositories/menu-category.repository';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { ListMenuCategoriesQueryDto } from './dto/list-menu-category-query.dto';
import {
  MenuCategoryResponse,
  MenuCategory,
  MenuCategoryListResponse,
} from './models/menu-category.model';

export class MenuCategoryService {
  constructor(
    private readonly repository: IMenuCategoryRepository,
    private readonly logger: Logger,
  ) {}

  async listMenuCategories(
    query: ListMenuCategoriesQueryDto,
  ): Promise<MenuCategoryListResponse> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const business_unit_id = query.business_unit_id;

      this.logger.info({ page, limit }, 'Fetching menu categories list');

      const { data, total } = await this.repository.findAll({
        page,
        limit,
        business_unit_id,
      });

      const totalPages = Math.ceil(total / limit);

      this.logger.info(
        { total, page, limit },
        'Menu categories list fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Data kategori menu berhasil diambil',
        data: data.map((category) => this.mapToResponse(category)),
        meta: { page, limit, total, totalPages },
      };
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      this.logger.error(
        { err: error },
        'Unexpected error while fetching menu categories list',
      );

      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  private mapToResponse(menuCategory: MenuCategory): MenuCategoryResponse {
    return {
      menu_category_id: menuCategory.menu_category_id,
      menu_category_name: menuCategory.category_name,
      business_unit_id: menuCategory.business_unit_id,
      business_unit_name: menuCategory.business_unit_name,
      description: menuCategory.description, // This would require a join to get the business unit name
    };
  }
}
