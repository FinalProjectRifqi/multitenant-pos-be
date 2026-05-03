import { Router } from 'express';
import { Knex } from 'knex';
import { Logger } from 'pino';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { validateRequest } from '../../common/middlewares/validate-request';
import { AppConfig } from '../../config';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { ListMenuCategoriesQueryDto } from './dto/list-menu-category-query.dto';
import { MenuCategoryController } from './menu-category.controller';
import { MenuCategoryService } from './menu-category.service';
import { MenuCategoryRepository } from './repositories/menu-category.repository';

interface MenuCategoryRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildMenuCategoryRouter = ({
  knex,
  config,
  logger,
}: MenuCategoryRouterDeps): Router => {
  const router = Router();
  const requirePermission = buildPermissionMiddleware(config, logger);

  const repository = new MenuCategoryRepository(knex);
  const service = new MenuCategoryService(repository, logger);
  const controller = new MenuCategoryController(service);

  router.get(
    '/',
    requirePermission('menu_category:read'),
    validateRequest(ListMenuCategoriesQueryDto, 'query'),
    asyncHandler((req, res) => controller.listMenuCategories(req, res)),
  );

  return router;
};
