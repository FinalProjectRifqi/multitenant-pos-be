import { cleanEnv, port, str } from 'envalid';
import type { NodeEnv } from './types';
import { getDatabaseConfig, type DatabaseConfig } from './database.config';
import { getLoggerConfig, type LoggerConfig } from './logger.config';
import { getCorsConfig, type CorsConfig } from './cors.config';

export type { NodeEnv, DatabaseConfig, LoggerConfig, CorsConfig };

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  database: DatabaseConfig;
  logger: LoggerConfig;
  cors: CorsConfig;
  isLocalEnv: boolean;
  isDevelopmentEnv: boolean;
  isProductionEnv: boolean;
}

export const getAppConfig = (): AppConfig => {
  const env = cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ['local', 'development', 'production'],
      default: 'local',
    }),
    PORT: port({ default: 3004 }),
  });

  const nodeEnv = env.NODE_ENV as NodeEnv;

  const database = getDatabaseConfig(nodeEnv);
  const logger = getLoggerConfig();
  const cors = getCorsConfig();

  return {
    nodeEnv,
    port: env.PORT,
    database,
    logger,
    cors,
    isLocalEnv: nodeEnv === 'local',
    isDevelopmentEnv: nodeEnv === 'development',
    isProductionEnv: nodeEnv === 'production',
  };
};
