import { Router } from 'express';
import type { Knex } from 'knex';
import type { Logger } from 'pino';
import type { AppConfig } from '../../config';
import { asyncHandler } from '../../common/middlewares/async-handler';
import { validateRequest } from '../../common/middlewares/validate-request';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AuthRepository } from './repositories/auth.repository';
import { LoginDto } from './dto/login.dto';

interface AuthRouterDeps {
  knex: Knex;
  config: AppConfig;
  logger: Logger;
}

export const buildAuthRouter = ({
  knex,
  config,
  logger,
}: AuthRouterDeps): Router => {
  const router = Router();

  const repository = new AuthRepository(knex);
  const service = new AuthService(repository, config, logger);
  const controller = new AuthController(service);

  router.post(
    '/login',
    validateRequest(LoginDto),
    asyncHandler((req, res) => controller.login(req, res)),
  );

  return router;
};
