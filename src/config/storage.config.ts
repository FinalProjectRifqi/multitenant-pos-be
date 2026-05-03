import { StorageClient } from '@supabase/storage-js';
import { cleanEnv, str } from 'envalid';

export interface StorageConfig {
  url: string;
  secretKey: string;
  bucketName: string;
  maxFileSizeBytes: number;
  signedUrlTtlSeconds: number;
}

const SIGNED_URL_TTL_SECONDS = 21600;

const parseFileSize = (value: string): number => {
  const match = value.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  if (!match) {
    throw new Error(`Invalid STORAGE_MAX_SIZE_PER_FILE format: "${value}". Expected e.g. "5MB"`);
  }
  const amount = parseFloat(match[1]);
  const unit = match[2].toUpperCase();
  const multipliers: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };
  return Math.floor(amount * multipliers[unit]);
};

export const getStorageConfig = (): StorageConfig => {
  const env = cleanEnv(process.env, {
    STORAGE_URL: str(),
    STORAGE_SECRET_KEYS: str(),
    STORAGE_BUCKET_NAME: str({ default: 'uploads' }),
    STORAGE_MAX_SIZE_PER_FILE: str({ default: '5MB' }),
  });

  return {
    url: env.STORAGE_URL,
    secretKey: env.STORAGE_SECRET_KEYS,
    bucketName: env.STORAGE_BUCKET_NAME,
    maxFileSizeBytes: parseFileSize(env.STORAGE_MAX_SIZE_PER_FILE),
    signedUrlTtlSeconds: SIGNED_URL_TTL_SECONDS,
  };
};

export const createStorageClient = (config: StorageConfig): StorageClient => {
  const storageUrl = `${config.url}/storage/v1`;
  return new StorageClient(storageUrl, {
    apikey: config.secretKey,
    Authorization: `Bearer ${config.secretKey}`,
  });
};
