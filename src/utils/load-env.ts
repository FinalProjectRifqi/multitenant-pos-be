import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

const loadEnvFile = (filePath: string): void => {
  if (fs.existsSync(filePath)) {
    dotenv.config({ path: filePath, override: true });
  }
};

export const loadEnv = (): void => {
  const root = process.cwd();
  loadEnvFile(path.join(root, '.env'));

  const nodeEnv = process.env.NODE_ENV ?? 'local';
  const envFile =
    nodeEnv === 'local'
      ? '.env.local'
      : nodeEnv === 'development'
        ? '.env.development'
        : '.env.production';

  loadEnvFile(path.join(root, envFile));
};
