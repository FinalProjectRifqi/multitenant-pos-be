import crypto from 'node:crypto';
import pino from 'pino';
import pinoHttp, { type Options as HttpLoggerOptions } from 'pino-http';
import type { Logger, LoggerOptions } from 'pino';
import type { LoggerConfig } from '../config/logger.config';

export const createLogger = (config: LoggerConfig): Logger => {
  const baseOptions: LoggerOptions<never, false> = {
    level: config.level,
    formatters: config.formatters,
  };

  if (config.format === 'pretty') {
    return pino<never, false>({
      ...baseOptions,
      transport: {
        target: 'pino-pretty',
        options: config.prettyOptions,
      },
    });
  }

  return pino<never, false>(baseOptions);
};

const buildHttpLoggerOptions = (config: LoggerConfig): HttpLoggerOptions => {
  const options: HttpLoggerOptions = {
    level: config.level,
    formatters: config.formatters,
  };

  if (config.format === 'pretty') {
    options.transport = {
      target: 'pino-pretty',
      options: config.prettyOptions,
    };
  }

  return options;
};

export const createHttpLogger = (config: LoggerConfig) =>
  pinoHttp({
    ...buildHttpLoggerOptions(config),
    genReqId: (req) =>
      (typeof req.headers['x-request-id'] === 'string' &&
        req.headers['x-request-id'].length > 0 &&
        req.headers['x-request-id']) ||
      req.id ||
      crypto.randomUUID(),
    customProps: (req) => ({
      requestId: req.id,
    }),
  });
