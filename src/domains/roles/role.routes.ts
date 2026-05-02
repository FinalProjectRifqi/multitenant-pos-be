import { Router } from 'express';
import { Knex } from 'knex';
import { Logger } from 'pino';
import { AppConfig } from '../../config';
import { buildPermissionMiddleware } from '../../routes/routes';
import { RoleRepository } from './role';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { validateRequest } from '../../common/middlewares/validate-request';
import { ListRoleQueryDto } from './dto/list-role-query.dto';
import { RoleService } from './role.service';
import { RoleController } from './role.controller';

interface BusinessUnitRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildRoleRouter = ({
  knex,
  config,
  logger,
}: BusinessUnitRouterDeps): Router => {
  const router = Router();
  const requirePermission = buildPermissionMiddleware(config, logger);

  const repository = new RoleRepository(knex);
  const service = new RoleService(repository, logger);
  const controller = new RoleController(service);

  router.get(
    '/',
    requirePermission('role:read'),
    validateRequest(ListRoleQueryDto, 'query'),
    asyncHandler((req, res) => controller.listRoles(req, res)),
  );

  return router;
};
