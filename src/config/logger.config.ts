import { cleanEnv, str } from 'envalid';
import type { Bindings } from 'pino';

export type LoggerFormat = 'json' | 'pretty';

export interface LoggerConfig {
  level: string;
  format: LoggerFormat;
  prettyOptions: {
    colorize: boolean;
    levelFirst: boolean;
    translateTime: string;
    ignore: string;
    messageFormat: string;
  };
  jsonOptions: {
    colorize: boolean;
    levelFirst: boolean;
    translateTime: boolean;
  };
  formatters: {
    level: (label: string) => { level: string };
    bindings: (bindings: Bindings) => {
      pid: number;
      hostname: string;
    };
  };
}

export const getLoggerConfig = (): LoggerConfig => {
  const env = cleanEnv(process.env, {
    LOG_LEVEL: str({
      choices: ['error', 'warn', 'info', 'debug', 'verbose'],
      default: 'info',
      desc: 'Logging level',
    }),
    LOG_FORMAT: str({
      choices: ['json', 'pretty'],
      default: 'pretty',
      desc: 'Logging format',
    }),
  });

  return {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT as LoggerFormat,
    prettyOptions: {
      colorize: true,
      levelFirst: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname,req,res',
      messageFormat: '{method} {url} {msg} - {res.statusCode}',
    },
    jsonOptions: {
      colorize: false,
      levelFirst: false,
      translateTime: false,
    },
    formatters: {
      level: (label: string) => ({
        level: `${label.toUpperCase()}`,
      }),
      bindings: (bindings: Bindings) => ({
        pid: bindings.pid,
        hostname: bindings.hostname,
      }),
    },
  };
};
