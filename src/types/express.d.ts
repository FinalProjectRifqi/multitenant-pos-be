import type { Logger } from 'pino';
import type { JwtTokenPayload } from '../domains/auth/models/auth.model';

declare global {
  namespace Express {
    interface Request {
      id?: string;
      log?: Logger;
      user?: JwtTokenPayload;
    }
  }
}

declare module 'express-serve-static-core' {
  interface Request {
    id?: string;
    log?: Logger;
    user?: JwtTokenPayload;
  }
}

export {};
