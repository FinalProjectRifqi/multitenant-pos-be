import { cleanEnv, num, port, str } from 'envalid';
import type { NodeEnv } from './types';
import { getDatabaseConfig, type DatabaseConfig } from './database.config';
import { getLoggerConfig, type LoggerConfig } from './logger.config';
import { getCorsConfig, type CorsConfig } from './cors.config';
import { getStorageConfig, type StorageConfig } from './storage.config';

export type { NodeEnv } from './types';
export type { DatabaseConfig } from './database.config';
export type { LoggerConfig } from './logger.config';
export type { CorsConfig } from './cors.config';
export type { StorageConfig } from './storage.config';

export interface JwtConfig {
  secret: string;
  expiresIn: string;
}

export interface OrderConfig {
  pendingStatusUuid: string;
  cancelStatusUuid: string;
  readyStatusUuid: string;
}

export interface MidtransConfig {
  serverKey: string;
  clientKey: string;
  merchantId: string;
  snapBaseUrl: string;
  isProduction: boolean;
}

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  database: DatabaseConfig;
  logger: LoggerConfig;
  cors: CorsConfig;
  jwt: JwtConfig;
  bcryptSaltRounds: number;
  storage: StorageConfig;
  order: OrderConfig;
  midtrans: MidtransConfig;
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
    PENDING_ORDER_STATUS_UUID: str(),
    CANCEL_ORDER_STATUS_UUID: str(),
    READY_ORDER_STATUS_UUID: str(),
    CLIENT_SECRET_KEY: str(),
    SERVER_SECRET_KEY: str(),
    MERCHANT_ID: str(),
  });

  const nodeEnv = env.NODE_ENV as NodeEnv;

  const database = getDatabaseConfig(nodeEnv);
  const logger = getLoggerConfig();
  const cors = getCorsConfig();
  const storage = getStorageConfig();

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
    storage,
    order: {
      pendingStatusUuid: env.PENDING_ORDER_STATUS_UUID,
      cancelStatusUuid: env.CANCEL_ORDER_STATUS_UUID,
      readyStatusUuid: env.READY_ORDER_STATUS_UUID,
    },
    midtrans: {
      serverKey: env.SERVER_SECRET_KEY,
      clientKey: env.CLIENT_SECRET_KEY,
      merchantId: env.MERCHANT_ID,
      snapBaseUrl:
        nodeEnv === 'production'
          ? 'https://app.midtrans.com/snap/v1'
          : 'https://app.sandbox.midtrans.com/snap/v1',
      isProduction: nodeEnv === 'production',
    },
    isLocalEnv: nodeEnv === 'local',
    isDevelopmentEnv: nodeEnv === 'development',
    isProductionEnv: nodeEnv === 'production',
  };
};
