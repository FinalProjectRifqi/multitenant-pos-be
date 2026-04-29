import { cleanEnv, str } from 'envalid';

export interface CorsConfig {
  originsAllow: string[];
}

const parseOrigins = (value: string): string[] =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

export const getCorsConfig = (): CorsConfig => {
  const env = cleanEnv(process.env, {
    CORS_ORIGINS_ALLOW: str({ default: '' }),
  });

  return {
    originsAllow: parseOrigins(env.CORS_ORIGINS_ALLOW),
  };
};
