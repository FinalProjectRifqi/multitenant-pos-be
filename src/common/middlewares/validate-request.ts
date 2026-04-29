import type { RequestHandler } from 'express';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import type { ClassConstructor } from 'class-transformer';
import { AppError } from '../errors/app-error';
import { ErrorCodes } from '../errors/error-codes';

type RequestSource = 'body' | 'query' | 'params';

export const validateRequest =
  <T extends object>(
    dtoClass: ClassConstructor<T>,
    source: RequestSource = 'body',
  ): RequestHandler =>
  (req, _res, next) => {
    const runValidation = async () => {
      const input = req[source];
      const instance = plainToInstance(dtoClass, input, {
        enableImplicitConversion: true,
      });
      const errors = await validate(instance, {
        whitelist: true,
        forbidNonWhitelisted: true,
      });

      if (errors.length > 0) {
        next(
          new AppError({
            code: ErrorCodes.ValidationFailed,
            message: 'Request validation failed',
            status: 400,
            details: errors,
          }),
        );
        return;
      }

      (req as unknown as Record<RequestSource, unknown>)[source] =
        instance as unknown;
      next();
    };

    void runValidation().catch(next);
  };
