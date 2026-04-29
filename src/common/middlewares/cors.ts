import type { CorsOptions } from 'cors';
import type { CorsConfig } from '../../config/cors.config';

export const buildCorsOptions = (config: CorsConfig): CorsOptions => {
  const allowAll = config.originsAllow.includes('*');

  if (allowAll) {
    return { origin: true, credentials: true };
  }

  if (config.originsAllow.length === 0) {
    return { origin: false };
  }

  return { origin: config.originsAllow, credentials: true };
};
