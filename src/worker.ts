/**
 * worker.ts — Cloudflare Workers entry point
 *
 * Bridges the Express app to the Workers fetch handler by converting a WHATWG
 * Request into a fake Node.js IncomingMessage/ServerResponse pair and passing
 * it to Express. Requires `nodejs_compat` compatibility flag.
 */

import 'reflect-metadata';
import { Readable } from 'node:stream';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { createApp } from './app';
import { getAppConfig } from './config';
import { createDatabase } from './database';
import { createLogger } from './logger';

type ExpressApp = ReturnType<typeof createApp>;

// Cached across isolate lifetime — Workers reuse the same isolate for many requests.
let cachedApp: ExpressApp | null = null;

function getApp(): ExpressApp {
  if (!cachedApp) {
    const config = getAppConfig();
    const logger = createLogger(config.logger);
    const knex = createDatabase(config.database);
    cachedApp = createApp({ config, knex, logger });
  }
  return cachedApp;
}

/**
 * Converts a WHATWG Request → fake Node.js IncomingMessage + runs Express
 * → converts the fake ServerResponse back into a WHATWG Response.
 */
async function expressHandler(
  app: ExpressApp,
  request: Request,
): Promise<Response> {
  const url = new URL(request.url);

  // Read body once (avoid consuming the stream twice)
  const bodyBuf =
    request.method !== 'GET' && request.method !== 'HEAD' && request.body
      ? Buffer.from(await request.arrayBuffer())
      : null;

  // Build fake IncomingMessage
  const readable = bodyBuf
    ? Readable.from(bodyBuf)
    : new Readable({
        read() {
          this.push(null);
        },
      });

  const reqHeaders: Record<string, string> = {};
  request.headers.forEach((value, key) => {
    reqHeaders[key] = value;
  });

  const req = Object.assign(readable, {
    method: request.method.toUpperCase(),
    url: url.pathname + url.search,
    headers: reqHeaders,
    httpVersion: '1.1',
    httpVersionMajor: 1,
    httpVersionMinor: 1,
    socket: {
      remoteAddress: '127.0.0.1',
      encrypted: url.protocol === 'https:',
    },
    connection: { remoteAddress: '127.0.0.1' },
    complete: false,
    aborted: false,
    trailers: {},
    rawTrailers: [],
    rawHeaders: Object.entries(reqHeaders).flat(),
  }) as unknown as IncomingMessage;

  return new Promise<Response>((resolve, reject) => {
    const chunks: Buffer[] = [];
    let statusCode = 200;
    const resHeaders = new Headers();

    const res = {
      writableEnded: false,
      headersSent: false,
      finished: false,
      getHeader(name: string) {
        return resHeaders.get(name.toLowerCase()) ?? undefined;
      },
      getHeaders() {
        const h: Record<string, string | string[] | number> = {};
        resHeaders.forEach((v, k) => {
          h[k] = v;
        });
        return h;
      },
      setHeader(name: string, value: string | number | readonly string[]) {
        const val = Array.isArray(value)
          ? (value as string[]).join(', ')
          : String(value);
        resHeaders.set(name.toLowerCase(), val);
        return res as unknown as ServerResponse;
      },
      removeHeader(name: string) {
        resHeaders.delete(name.toLowerCase());
      },
      hasHeader(name: string) {
        return resHeaders.has(name.toLowerCase());
      },
      write(chunk: Buffer | string, encodingOrCb?: unknown, cb?: unknown) {
        chunks.push(
          typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer),
        );
        const callback =
          typeof encodingOrCb === 'function'
            ? (encodingOrCb as () => void)
            : typeof cb === 'function'
              ? (cb as () => void)
              : undefined;
        if (callback) callback();
        return true;
      },
      end(chunk?: Buffer | string, encodingOrCb?: unknown, cb?: unknown) {
        if (chunk)
          chunks.push(
            typeof chunk === 'string' ? Buffer.from(chunk) : (chunk as Buffer),
          );
        res.writableEnded = true;
        res.finished = true;
        const body = chunks.length > 0 ? Buffer.concat(chunks) : null;
        resolve(
          new Response(body, { status: statusCode, headers: resHeaders }),
        );
        const callback =
          typeof encodingOrCb === 'function'
            ? (encodingOrCb as () => void)
            : typeof cb === 'function'
              ? (cb as () => void)
              : undefined;
        if (callback) callback();
        return res as unknown as ServerResponse;
      },
      on() {
        return res as unknown as ServerResponse;
      },
      once() {
        return res as unknown as ServerResponse;
      },
      off() {
        return res as unknown as ServerResponse;
      },
      emit() {
        return false;
      },
    };

    // statusCode needs to be a settable property (Express uses `res.statusCode = n`)
    Object.defineProperty(res, 'statusCode', {
      get: () => statusCode,
      set: (v: number) => {
        statusCode = v;
      },
    });

    try {
      (
        app as unknown as (
          req: IncomingMessage,
          res: ServerResponse,
          next: (err?: unknown) => void,
        ) => void
      )(req, res as unknown as ServerResponse, (err?: unknown) => {
        if (err) reject(err instanceof Error ? err : new Error(String(err)));
        else resolve(new Response('Not Found', { status: 404 }));
      });
    } catch (err) {
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
}

export default {
  async fetch(
    request: Request,
    env: Record<string, string>,
  ): Promise<Response> {
    // Populate process.env from Workers vars/secrets (nodejs_compat)
    Object.assign(process.env, env);
    try {
      return await expressHandler(getApp(), request);
    } catch (err) {
      console.error('[worker] unhandled error:', err);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
} satisfies ExportedHandler;
