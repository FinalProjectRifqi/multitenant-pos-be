import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { buildPermissionMiddleware } from '../../common/middlewares/require-permission';
import { validateRequest } from '../../common/middlewares/validate-request';
import { CreateUserDto } from './dto/create-user.dto';
import { ListUsersQueryDto } from './dto/list-users-query.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserParamsDto } from './dto/user-params.dto';
import { UserController } from './user.controller';
import { UserRepository } from './repositories/user.repository';
import { UserService } from './user.service';

interface UserRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildUserRouter = ({
  knex,
  config,
  logger,
}: UserRouterDeps): Router => {
  const router = Router();
  const requirePermission = buildPermissionMiddleware(config, logger);

  const repository = new UserRepository(knex);
  const service = new UserService(repository, config, logger);
  const controller = new UserController(service);

  router.get(
    '/',
    requirePermission('user:read'),
    validateRequest(ListUsersQueryDto, 'query'),
    asyncHandler((req, res) => controller.listUsers(req, res)),
  );

  // /stats must be defined BEFORE /:id to avoid "stats" being treated as an ID
  router.get(
    '/stats',
    requirePermission('user:read'),
    asyncHandler((req, res) => controller.getUserStats(req, res)),
  );

  router.post(
    '/',
    requirePermission(['user:read', 'user:create', 'unit:assign_user']),
    validateRequest(CreateUserDto),
    asyncHandler((req, res) => controller.createUser(req, res)),
  );

  router.get(
    '/:id',
    requirePermission('user:read'),
    validateRequest(UserParamsDto, 'params'),
    asyncHandler((req, res) => controller.getUserById(req, res)),
  );

  router.patch(
    '/:id',
    requirePermission(['user:read', 'user:update', 'unit:assign_user']),
    validateRequest(UserParamsDto, 'params'),
    validateRequest(UpdateUserDto),
    asyncHandler((req, res) => controller.updateUser(req, res)),
  );

  router.delete(
    '/:id',
    requirePermission(['user:read', 'user:delete']),
    validateRequest(UserParamsDto, 'params'),
    asyncHandler((req, res) => controller.deleteUser(req, res)),
  );

  return router;
};
