import { cleanEnv, num, port, str } from 'envalid';
import type { NodeEnv } from './types';
import { getDatabaseConfig, type DatabaseConfig } from './database.config';
import { getLoggerConfig, type LoggerConfig } from './logger.config';
import { getCorsConfig, type CorsConfig } from './cors.config';

export type { NodeEnv, DatabaseConfig, LoggerConfig, CorsConfig };

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  database: DatabaseConfig;
  logger: LoggerConfig;
  cors: CorsConfig;
  jwt: JwtConfig;
  bcryptSaltRounds: number;
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
    JWT_SECRET: str(),
    JWT_EXPIRES_IN: str({ default: '1h' }),
    BCRYPT_SALT_ROUNDS: num({ default: 12 }),
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
    jwt: {
      secret: env.JWT_SECRET,
      expiresIn: env.JWT_EXPIRES_IN,
    },
    bcryptSaltRounds: env.BCRYPT_SALT_ROUNDS,
    isLocalEnv: nodeEnv === 'local',
    isDevelopmentEnv: nodeEnv === 'development',
    isProductionEnv: nodeEnv === 'production',
  };
};
