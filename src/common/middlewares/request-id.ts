import type { RequestHandler } from 'express';
import { randomUUID } from 'crypto';

export const requestId = (): RequestHandler => (req, res, next) => {
  const headerValue = req.headers['x-request-id'];
  const requestIdValue =
    typeof headerValue === 'string' && headerValue.trim().length > 0
      ? headerValue
      : randomUUID();

  req.id = requestIdValue;
  res.setHeader('x-request-id', requestIdValue);
  next();
};
