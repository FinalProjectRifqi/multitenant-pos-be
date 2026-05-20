import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../config';
import { buildHealthRouter } from './health.routes';
import { buildAuthRouter } from '../domains/auth/auth';
import { buildBusinessUnitRouter } from '../domains/business-units/business-unit';
import { buildRoleRouter } from '../domains/roles/role.routes';
import { buildMenuRouter } from '../domains/menus/menus';
import { buildUserRouter } from '../domains/users/user';
import { buildMenuCategoryRouter } from '../domains/menu-categories/menu-category';
import { buildInventarisRouter } from '../domains/inventaris/inventaris';
import { buildOrderRouter } from '../domains/orders/order';
import { buildOrderTypeRouter } from '../domains/order-types/order-type.routes';
import { buildKdsOrderStatusRouter } from '../domains/kds-order-status/kds-order-status.routes';
import { buildAnalyticsRouter } from '../domains/analytics/analytics.routes';
import {
  createOrderEventBus,
  registerOrderEventLogging,
} from '../common/events/order-event-bus';

export type { RequirePermissionFactory } from '../common/middlewares/require-permission';
export { buildPermissionMiddleware } from '../common/middlewares/require-permission';

interface ApiRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildApiRouter = ({
  knex,
  config,
  logger,
}: ApiRouterDeps): Router => {
  const router = Router();

  const orderEventBus = createOrderEventBus();
  registerOrderEventLogging(logger, orderEventBus);

  router.use('/health', buildHealthRouter({ knex }));
  router.use('/auth', buildAuthRouter({ knex, config, logger }));
  router.use(
    '/business-units',
    buildBusinessUnitRouter({ knex, config, logger }),
  );
  router.use('/roles', buildRoleRouter({ knex, config, logger }));
  router.use('/users', buildUserRouter({ knex, config, logger }));
  router.use('/menus', buildMenuRouter({ knex, config, logger }));
  router.use(
    '/menu-categories',
    buildMenuCategoryRouter({ knex, config, logger }),
  );
  router.use('/inventaris', buildInventarisRouter({ knex, config, logger }));
  router.use('/orders', buildOrderRouter({ knex, config, logger }));
  router.use('/order-types', buildOrderTypeRouter({ knex, config, logger }));
  router.use(
    '/order-status',
    buildKdsOrderStatusRouter({
      knex,
      config,
      logger,
      orderEventBus,
    }),
  );
  router.use('/analytics', buildAnalyticsRouter({ knex, config, logger }));

  return router;
};
