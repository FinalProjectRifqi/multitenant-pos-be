/**
 * worker.ts — Cloudflare Workers entry point
 *
 * Wraps the Express app as a WHATWG-fetch-compatible handler via
 * @whatwg-node/server so it can run inside the Workers runtime.
 *
 * With the `nodejs_compat` compatibility flag, `process.env` is populated
 * from wrangler.toml [vars] and `wrangler secret put` values automatically.
 * No .env file loading is needed here.
 */

import 'reflect-metadata';
import { createServerAdapter } from '@whatwg-node/server';
import { createApp } from './app';
import { getAppConfig } from './config';
import { createDatabase } from './database';
import { createLogger } from './logger';

let cachedApp: ReturnType<typeof createApp> | null = null;

function getApp() {
  if (!cachedApp) {
    const config = getAppConfig();
    const logger = createLogger(config.logger);
    const knex = createDatabase(config.database);
    cachedApp = createApp({ config, knex, logger });
  }
  return cachedApp;
}

export default createServerAdapter((request: Request) => {
  const app = getApp();
  // @ts-expect-error — Express handler is compatible at runtime via nodejs_compat
  return app(request);
});
