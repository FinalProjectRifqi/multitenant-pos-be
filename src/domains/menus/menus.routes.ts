import { Router } from 'express';
import multer from 'multer';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { createStorageClient } from '../../config/storage.config';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { validateRequest } from '../../common/middlewares/validate-request';
import { StorageRepository, StorageService } from '../../libs/storage/storage';
import { CreateMenuDto } from './dto/create-menu.dto';
import { ListMenusQueryDto } from './dto/list-menus-query.dto';
import {
  MenuBusinessIdParamsDto,
  MenuItemParamsDto,
} from './dto/menu-params.dto';
import { UpdateMenuDto } from './dto/update-menu.dto';
import { MenuController } from './menus.controller';
import { MenuService } from './menus.service';
import { MenuRepository } from './repositories/menu.repository';

interface MenuRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

const upload = multer({ storage: multer.memoryStorage() });

export const buildMenuRouter = ({
  knex,
  config,
  logger,
}: MenuRouterDeps): Router => {
  const router = Router();
  const requirePermission = buildPermissionMiddleware(config, logger);

  const storageClient = createStorageClient(config.storage);
  const storageRepository = new StorageRepository(knex);
  const storageService = new StorageService(
    storageRepository,
    storageClient,
    config.storage,
    logger,
  );

  const repository = new MenuRepository(knex);
  const service = new MenuService(repository, storageService, config, logger);
  const controller = new MenuController(service);

  router.get(
    '/:businessId',
    requirePermission(['menu:read', 'menu_category:read']),
    validateRequest(MenuBusinessIdParamsDto, 'params'),
    validateRequest(ListMenusQueryDto, 'query'),
    asyncHandler((req, res) => controller.listMenus(req, res)),
  );

  // /stats HARUS sebelum /:menuId agar tidak dianggap sebagai menuId
  router.get(
    '/:businessId/stats',
    requirePermission(['menu:read', 'menu_category:read']),
    validateRequest(MenuBusinessIdParamsDto, 'params'),
    asyncHandler((req, res) => controller.getMenuStats(req, res)),
  );

  router.post(
    '/:businessId',
    requirePermission(['menu:read', 'menu:create']),
    upload.single('menu_image'),
    validateRequest(MenuBusinessIdParamsDto, 'params'),
    validateRequest(CreateMenuDto),
    asyncHandler((req, res) => controller.createMenu(req, res)),
  );

  router.get(
    '/:businessId/:menuId',
    requirePermission('menu:read'),
    validateRequest(MenuItemParamsDto, 'params'),
    asyncHandler((req, res) => controller.getMenuById(req, res)),
  );

  router.patch(
    '/:businessId/:menuId',
    requirePermission(['menu:read', 'menu:update']),
    upload.single('menu_image'),
    validateRequest(MenuItemParamsDto, 'params'),
    validateRequest(UpdateMenuDto),
    asyncHandler((req, res) => controller.updateMenu(req, res)),
  );

  router.delete(
    '/:businessId/:menuId',
    requirePermission(['menu:read', 'menu:delete']),
    validateRequest(MenuItemParamsDto, 'params'),
    asyncHandler((req, res) => controller.deleteMenu(req, res)),
  );

  return router;
};
