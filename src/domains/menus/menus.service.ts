import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { unitNotFoundError } from '../business-units/errors/business-unit.errors';
import type { StorageService } from '../../libs/storage/storage.service';
import type { CreateMenuDto } from './dto/create-menu.dto';
import type { ListMenusQueryDto } from './dto/list-menus-query.dto';
import type { UpdateMenuDto } from './dto/update-menu.dto';
import {
  menuCategoryNotFoundError,
  menuConflictError,
  menuInvalidImageTypeError,
  menuNotFoundError,
} from './errors/menu.errors';
import type {
  MenuCreateResponse,
  MenuDeleteResponse,
  MenuDetailResponse,
  MenuListResponse,
  MenuMutationResponse,
  MenuResponse,
  MenuRow,
  MenuStatsResponse,
  MenuUpdateResponse,
} from './models/menu.model';
import type {
  IMenuRepository,
  MenuSortByColumn,
} from './repositories/menu.repository';

export class MenuService {
  constructor(
    private readonly repository: IMenuRepository,
    private readonly storageService: StorageService,
    private readonly config: AppConfig,
    private readonly logger: Logger,
  ) {}

  async listMenus(
    businessId: string,
    query: ListMenusQueryDto,
  ): Promise<MenuListResponse> {
    try {
      const page = query.page ?? 1;
      const limit = query.limit ?? 10;
      const sortBy = (query.sortBy as MenuSortByColumn | undefined) ?? 'menu_name';
      const sortType = query.sortType ?? 'ASC';
      const search =
        query.search && query.search.trim().length > 0
          ? query.search.trim()
          : undefined;

      this.logger.info(
        { businessId, page, limit, search, sortBy, sortType },
        'Fetching menus list',
      );

      const unit = await this.repository.findUnitById(businessId);
      if (!unit) {
        this.logger.warn({ businessId }, 'Menus list failed - unit not found');
        throw unitNotFoundError();
      }

      const { data, total } = await this.repository.findAll({
        businessId,
        page,
        limit,
        search,
        sortBy,
        sortType,
      });

      const signedUrls = await this.resolveSignedUrls(data);
      const totalPages = Math.ceil(total / limit);

      this.logger.info(
        { businessId, total, page, limit },
        'Menus list fetched successfully',
      );

      return {
        success: true,
        statusCode: 200,
        message: 'Data menu berhasil diambil',
        data: data.map((row) =>
          this.mapToResponse(row, signedUrls.get(row.menu_id) ?? null),
        ),
        meta: { page, limit, total, totalPages },
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId },
        'Unexpected error while fetching menus list',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getMenuStats(businessId: string): Promise<MenuStatsResponse> {
    try {
      this.logger.info({ businessId }, 'Fetching menu stats');

      const unit = await this.repository.findUnitById(businessId);
      if (!unit) {
        this.logger.warn(
          { businessId },
          'Menu stats failed - unit not found',
        );
        throw unitNotFoundError();
      }

      const stats = await this.repository.getStats(businessId);

      this.logger.info({ businessId, stats }, 'Menu stats fetched successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Statistik menu berhasil diambil',
        data: stats,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId },
        'Unexpected error while fetching menu stats',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async createMenu(
    businessId: string,
    dto: CreateMenuDto,
    file?: Express.Multer.File,
  ): Promise<MenuCreateResponse> {
    try {
      this.logger.info(
        { businessId, menuName: dto.menu_name },
        'Creating menu',
      );

      const unit = await this.repository.findUnitById(businessId);
      if (!unit) {
        this.logger.warn({ businessId }, 'Menu creation failed - unit not found');
        throw unitNotFoundError();
      }

      const category = await this.repository.findCategoryById(
        dto.menu_category_id,
        businessId,
      );
      if (!category) {
        this.logger.warn(
          { businessId, categoryId: dto.menu_category_id },
          'Menu creation failed - category not found or not belonging to unit',
        );
        throw menuCategoryNotFoundError();
      }

      const existing = await this.repository.findByName(
        dto.menu_name,
        businessId,
      );
      if (existing) {
        this.logger.warn(
          { businessId, menuName: dto.menu_name },
          'Menu creation failed - name already exists in this unit',
        );
        throw menuConflictError();
      }

      let blobId: string | null = null;

      if (file) {
        this.validateFileInput(file);

        const uploadResult = await this.storageService.uploadFile({
          file: file.buffer,
          fileName: file.originalname,
          mimeType: file.mimetype,
          sizeBytes: file.size,
          folder: this.buildStorageFolder(businessId),
        });

        blobId = uploadResult.data.id_blob;
        this.logger.info(
          { businessId, blobId },
          'Menu image uploaded to storage',
        );
      }

      let menuItemId: string;
      try {
        const created = await this.repository.create(
          {
            menu_category_id: dto.menu_category_id,
            menu_item_name: dto.menu_name,
            item_price: dto.item_price,
            is_available: dto.is_available,
            blob_id: blobId,
          },
          businessId,
        );
        menuItemId = created.menu_item_id;
      } catch (dbError) {
        if (blobId) {
          this.logger.error(
            { err: dbError, blobId },
            'DB insert failed after image upload — compensating storage',
          );
          try {
            await this.storageService.deleteFile(blobId);
          } catch (compensateError) {
            this.logger.error(
              { err: compensateError, blobId },
              'Storage compensation failed — orphan file in storage',
            );
          }
        }
        throw dbError;
      }

      const signedUrl = blobId
        ? await this.getSignedUrlSafe(blobId)
        : null;

      const row = await this.repository.findById(businessId, menuItemId);

      this.logger.info(
        { businessId, menuId: menuItemId },
        'Menu created successfully',
      );

      return {
        success: true,
        statusCode: 201,
        message: 'Menu berhasil dibuat',
        data: this.mapToMutationResponse(row!, signedUrl),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId },
        'Unexpected error while creating menu',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async getMenuById(
    businessId: string,
    menuId: string,
  ): Promise<MenuDetailResponse> {
    try {
      this.logger.info({ businessId, menuId }, 'Fetching menu by ID');

      const unit = await this.repository.findUnitById(businessId);
      if (!unit) {
        this.logger.warn({ businessId }, 'Menu detail failed - unit not found');
        throw unitNotFoundError();
      }

      const row = await this.repository.findById(businessId, menuId);
      if (!row) {
        this.logger.warn({ businessId, menuId }, 'Menu not found');
        throw menuNotFoundError();
      }

      const signedUrl = row.blob_id
        ? await this.getSignedUrlSafe(row.blob_id)
        : null;

      this.logger.info({ businessId, menuId }, 'Menu fetched successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Detail menu berhasil diambil',
        data: this.mapToResponse(row, signedUrl),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, menuId },
        'Unexpected error while fetching menu',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async updateMenu(
    businessId: string,
    menuId: string,
    dto: UpdateMenuDto,
    file?: Express.Multer.File,
  ): Promise<MenuUpdateResponse> {
    try {
      this.logger.info({ businessId, menuId }, 'Updating menu');

      const unit = await this.repository.findUnitById(businessId);
      if (!unit) {
        this.logger.warn({ businessId }, 'Menu update failed - unit not found');
        throw unitNotFoundError();
      }

      const existing = await this.repository.findById(businessId, menuId);
      if (!existing) {
        this.logger.warn(
          { businessId, menuId },
          'Menu update failed - menu not found',
        );
        throw menuNotFoundError();
      }

      const hasAnyField =
        dto.menu_name !== undefined ||
        dto.menu_category_id !== undefined ||
        dto.item_price !== undefined ||
        dto.is_available !== undefined ||
        file !== undefined;

      if (!hasAnyField) {
        throw new AppError({
          code: ErrorCodes.ValidationFailed,
          message: 'Minimal satu field harus diisi untuk melakukan pembaruan',
          status: 400,
        });
      }

      if (dto.menu_category_id !== undefined) {
        const category = await this.repository.findCategoryById(
          dto.menu_category_id,
          businessId,
        );
        if (!category) {
          this.logger.warn(
            { businessId, categoryId: dto.menu_category_id },
            'Menu update failed - category not found or not belonging to unit',
          );
          throw menuCategoryNotFoundError();
        }
      }

      if (dto.menu_name !== undefined) {
        const conflict = await this.repository.findByName(
          dto.menu_name,
          businessId,
          menuId,
        );
        if (conflict) {
          this.logger.warn(
            { businessId, menuName: dto.menu_name },
            'Menu update failed - name already exists in this unit',
          );
          throw menuConflictError();
        }
      }

      let newBlobId: string | undefined;

      if (file) {
        this.validateFileInput(file);

        if (existing.blob_id) {
          await this.storageService.updateFile(existing.blob_id, {
            file: file.buffer,
            fileName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            folder: this.buildStorageFolder(businessId),
          });
          this.logger.info(
            { businessId, menuId, blobId: existing.blob_id },
            'Menu image updated in storage',
          );
        } else {
          const uploadResult = await this.storageService.uploadFile({
            file: file.buffer,
            fileName: file.originalname,
            mimeType: file.mimetype,
            sizeBytes: file.size,
            folder: this.buildStorageFolder(businessId),
          });
          newBlobId = uploadResult.data.id_blob;
          this.logger.info(
            { businessId, menuId, blobId: newBlobId },
            'New menu image uploaded to storage',
          );
        }
      }

      const updateData = {
        menu_category_id: dto.menu_category_id,
        menu_item_name: dto.menu_name,
        item_price: dto.item_price,
        is_available: dto.is_available,
        ...(newBlobId !== undefined ? { blob_id: newBlobId } : {}),
      };

      try {
        await this.repository.update(menuId, updateData);
      } catch (dbError) {
        if (newBlobId) {
          this.logger.error(
            { err: dbError, newBlobId },
            'DB update failed after new image upload — compensating storage',
          );
          try {
            await this.storageService.deleteFile(newBlobId);
          } catch (compensateError) {
            this.logger.error(
              { err: compensateError, newBlobId },
              'Storage compensation failed — orphan file in storage',
            );
          }
        }
        throw dbError;
      }

      const updated = await this.repository.findById(businessId, menuId);
      const blobIdForUrl = updated?.blob_id ?? null;
      const signedUrl = blobIdForUrl
        ? await this.getSignedUrlSafe(blobIdForUrl)
        : null;

      this.logger.info({ businessId, menuId }, 'Menu updated successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Menu berhasil diperbarui',
        data: this.mapToMutationResponse(updated!, signedUrl),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, menuId },
        'Unexpected error while updating menu',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  async deleteMenu(
    businessId: string,
    menuId: string,
  ): Promise<MenuDeleteResponse> {
    try {
      this.logger.info({ businessId, menuId }, 'Deleting menu');

      const unit = await this.repository.findUnitById(businessId);
      if (!unit) {
        this.logger.warn({ businessId }, 'Menu delete failed - unit not found');
        throw unitNotFoundError();
      }

      const existing = await this.repository.findById(businessId, menuId);
      if (!existing) {
        this.logger.warn(
          { businessId, menuId },
          'Menu delete failed - menu not found',
        );
        throw menuNotFoundError();
      }

      await this.repository.softDelete(menuId);

      if (existing.blob_id) {
        try {
          await this.storageService.deleteFile(existing.blob_id);
        } catch (storageError) {
          this.logger.error(
            { err: storageError, menuId, blobId: existing.blob_id },
            'Storage delete failed — rolling back DB soft delete',
          );
          try {
            await this.repository.undoSoftDelete(menuId);
          } catch (rollbackError) {
            this.logger.error(
              { err: rollbackError, menuId },
              'DB rollback failed after storage delete error — data inconsistent',
            );
          }
          throw storageError;
        }
      }

      this.logger.info({ businessId, menuId }, 'Menu deleted successfully');

      return {
        success: true,
        statusCode: 200,
        message: 'Menu berhasil dihapus',
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      this.logger.error(
        { err: error, businessId, menuId },
        'Unexpected error while deleting menu',
      );
      throw new AppError({
        code: ErrorCodes.Internal,
        message: 'Terjadi kesalahan internal',
        status: 500,
      });
    }
  }

  private validateFileInput(file: Express.Multer.File): void {
    if (!file.mimetype.startsWith('image/')) {
      throw menuInvalidImageTypeError();
    }

    if (file.size > this.config.storage.maxFileSizeBytes) {
      const maxSizeMB = this.config.storage.maxFileSizeBytes / (1024 * 1024);
      throw new AppError({
        code: ErrorCodes.ValidationFailed,
        message: `Ukuran file gambar melebihi batas ${maxSizeMB}MB`,
        status: 400,
      });
    }
  }

  private buildStorageFolder(businessId: string): string {
    return `menus/${businessId}`;
  }

  private async getSignedUrlSafe(blobId: string): Promise<string | null> {
    try {
      const result = await this.storageService.getFile(blobId);
      return result.data.signed_url;
    } catch (err) {
      this.logger.warn(
        { err, blobId },
        'Failed to generate signed URL for menu image',
      );
      return null;
    }
  }

  private async resolveSignedUrls(
    rows: MenuRow[],
  ): Promise<Map<string, string>> {
    const rowsWithBlob = rows.filter((r) => r.blob_id !== null);

    if (rowsWithBlob.length === 0) {
      return new Map();
    }

    const results = await Promise.all(
      rowsWithBlob.map(async (row) => {
        const url = await this.getSignedUrlSafe(row.blob_id!);
        return { menuId: row.menu_id, url };
      }),
    );

    const urlMap = new Map<string, string>();
    for (const { menuId, url } of results) {
      if (url) urlMap.set(menuId, url);
    }
    return urlMap;
  }

  private mapToResponse(row: MenuRow, signedUrl: string | null): MenuResponse {
    return {
      menu_id: row.menu_id,
      menu_name: row.menu_name,
      menu_category_id: row.menu_category_id,
      menu_category_name: row.menu_category_name,
      menu_price: Number(row.menu_price),
      menu_image: signedUrl,
      business_unit_id: row.business_unit_id,
      business_unit_name: row.business_unit_name,
      is_available: row.is_available,
    };
  }

  private mapToMutationResponse(
    row: MenuRow,
    signedUrl: string | null,
  ): MenuMutationResponse {
    return {
      menu_id: row.menu_id,
      menu_name: row.menu_name,
      menu_category_id: row.menu_category_id,
      menu_category_name: row.menu_category_name,
      menu_price: Number(row.menu_price),
      menu_image: signedUrl,
      is_available: row.is_available,
    };
  }
}
