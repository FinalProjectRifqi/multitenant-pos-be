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

import { createServerAdapter } from '@whatwg-node/server';
import 'reflect-metadata';
import { createApp } from './app';
import { getAppConfig } from './config';
import { createDatabase } from './database';
import { createLogger } from './logger';

let cachedAdapter: ReturnType<typeof createServerAdapter> | null = null;

function getAdapter() {
  if (!cachedAdapter) {
    const config = getAppConfig();
    const logger = createLogger(config.logger);
    const knex = createDatabase(config.database);
    const app = createApp({ config, knex, logger });
    // createServerAdapter accepts an Express app directly —
    // it internally calls app.handle() which matches (req, res, next)
    cachedAdapter = createServerAdapter(app);
  }
  return cachedAdapter;
}

export default {
  fetch(request: Request, env: Record<string, string>): Promise<Response> {
    // Inject wrangler env vars into process.env for nodejs_compat
    Object.assign(process.env, env);
    return getAdapter().fetch(request);
  },
} satisfies ExportedHandler;
