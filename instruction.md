<context>

Kita akan init sebuah repository backend di folder ini. Backend ini akan menggunakan express + typescript + knex + pnpm. Arsitektur yang akan kita gunakan adalah DDD (domain-driven-development).

Untuk struktur folder atau filenya aku sudah mempunyai gambaran seperti di bawah ini.

```
multi-tenant-pos-be
├── src/
│   ├── common/
│   │   ├── errors/
│   │   │   ├── error-codes.ts
│   │   │   └── error-codes-domain.ts
│   │   └── middlewares/
│   ├── config/
│   │   ├── development/
│   │   │   └── database.ts
│   │   ├── production/
│   │   │   └── database.ts
│   │   ├── local/
│   │   │   └── database.ts
│   │   ├── logger.config.ts
│   │   ├── database.config.ts
│   │   └── index.ts
│   ├── domains/
│   │   └── orders/
│   │       ├── dto/
│   │       ├── errors/
│   │       ├── models/
│   │       ├── repositories/
│   │       ├── order.controller.ts
│   │       ├── order.service.ts
│   │       ├── order.ts
│   │       ├── routes/
│   │       ├── order.routes.ts
│   │       └── __tests__/
│   ├── database/
│   │   └── index.ts
│   ├── utils/
│   ├── main.ts
│   ├── knexfile.js
│   ├── tsconfig.build.json
│   ├── tsconfig.json
│   ├── README.md
│   ├── eslint.config.mjs
│   ├── .prettierrc
│   ├── .env
│   ├── .env.development
│   ├── .env.local
│   ├── package.json
│   └── routes/
│       └── routes.ts
└── dist/


```

Ini beberapa code snippet yang akan kita pakai. Please take a note bahwa beberapa code snippet ini kuambil dari project nestjs aku dan bukan expressjs

src/config/development/database.ts

```typescript
import { cleanEnv, str, port } from "envalid";

/**
 * Development Server Database Configuration
 * For remote development PostgreSQL server
 *
 * NOTE: This connects to REMOTE dev server database.
 * Use NODE_ENV=development to activate this configuration.
 */

export interface DevelopmentDatabaseConfig {
  client: "pg";
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl:
      | boolean
      | {
          rejectUnauthorized: boolean;
          ca?: string;
          key?: string;
          cert?: string;
        };
  };
  pool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
  migrations: {
    tableName: string;
    directory: string;
  };
  seeds: {
    directory: string;
  };
  debug: boolean;
  acquireConnectionTimeout: number;
  asyncStackTraces: boolean;
}

export default (): DevelopmentDatabaseConfig => {
  const env = cleanEnv(process.env, {
    DEV_DB_HOST: str({ default: "your-dev-server.example.com" }),
    DEV_DB_PORT: port({ default: 5432 }),
    DEV_DB_USER: str({ default: "dev_user" }),
    DEV_DB_PASSWORD: str({ default: "dev_password" }),
    DEV_DB_NAME: str({ default: "nest_app_dev" }),
    DEV_DB_SSL: str({ choices: ["true", "false"], default: "true" }),
    DEV_DB_SSL_REJECT_UNAUTHORIZED: str({
      choices: ["true", "false"],
      default: "true",
    }),
    DEV_DB_SSL_CA: str({ default: "" }),
    DEV_DB_SSL_KEY: str({ default: "" }),
    DEV_DB_SSL_CERT: str({ default: "" }),
  });

  const config: DevelopmentDatabaseConfig = {
    client: "pg",
    connection: {
      host: env.DEV_DB_HOST,
      port: env.DEV_DB_PORT,
      user: env.DEV_DB_USER,
      password: env.DEV_DB_PASSWORD,
      database: env.DEV_DB_NAME,
      // SSL configuration for remote server
      ssl:
        env.DEV_DB_SSL === "true"
          ? {
              rejectUnauthorized:
                env.DEV_DB_SSL_REJECT_UNAUTHORIZED !== "false",
              ca: env.DEV_DB_SSL_CA || undefined,
              key: env.DEV_DB_SSL_KEY || undefined,
              cert: env.DEV_DB_SSL_CERT || undefined,
            }
          : false,
    },
    pool: {
      min: 1,
      max: 5, // Smaller pool for shared dev server
      // Connection timeout for remote server
      acquireTimeoutMillis: 30000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./src/database/migrations",
    },
    seeds: {
      directory: "./src/database/seeds",
    },
    // Development-specific configurations
    debug: process.env.DB_DEBUG === "true",
    acquireConnectionTimeout: 30000,
    // Retry logic for unstable connections
    asyncStackTraces: true,
  };

  return config;
};
// Example of hardcoded configuration (not recommended for production)
// Replace with actual values or environment variables as needed
// export default {
//   client: 'pg',
//   connection: {
//     host: process.env.DEV_DB_HOST || 'your-dev-server.example.com',
//     port: parseInt(process.env.DEV_DB_PORT || '5432', 10),
//     user: process.env.DEV_DB_USER || 'dev_user',
//     password: process.env.DEV_DB_PASSWORD || 'dev_password',
//     database: process.env.DEV_DB_NAME || 'nest_app_dev',
//     // SSL configuration for remote server
//     ssl:
//       process.env.DEV_DB_SSL === 'true'
//         ? {
//             rejectUnauthorized:
//               process.env.DEV_DB_SSL_REJECT_UNAUTHORIZED !== 'false',
//             ca: process.env.DEV_DB_SSL_CA,
//             key: process.env.DEV_DB_SSL_KEY,
//             cert: process.env.DEV_DB_SSL_CERT,
//           }
//         : false,
//   },
//   pool: {
//     min: 1,
//     max: 5, // Smaller pool for shared dev server
//     // Connection timeout for remote server
//     acquireTimeoutMillis: 30000,
//     createTimeoutMillis: 30000,
//     destroyTimeoutMillis: 5000,
//     idleTimeoutMillis: 30000,
//     reapIntervalMillis: 1000,
//     createRetryIntervalMillis: 100,
//   },
//   migrations: {
//     tableName: 'knex_migrations',
//     directory: './src/database/migrations',
//   },
//   seeds: {
//     directory: './src/database/seeds',
//   },
//   // Development-specific configurations
//   debug: process.env.DB_DEBUG === 'true',
//   acquireConnectionTimeout: 30000,
//   // Retry logic for unstable connections
//   asyncStackTraces: true,
// };
```

src/production/development/database.ts

```typescript
import { cleanEnv, port, str } from "envalid";
/**
 * Production Database Configuration
 * For production PostgreSQL server with enterprise features
 */

export interface ProductionDatabaseConfig {
  client: "pg";
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl:
      | boolean
      | {
          rejectUnauthorized: boolean;
          ca?: string;
          key?: string;
          cert?: string;
        };
    // Additional production-specific connection options
    keepAlive: boolean;
    statement_timeout: number;
    query_timeout: number;
    connectionTimeoutMillis: number;
  };
  pool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
    propagateCreateError: boolean;
  };
  migrations: {
    tableName: string;
    directory: string;
    disableTransactions: boolean;
    loadExtensions: string[];
  };
  seeds: {
    directory: string;
    loadExtensions: string[];
  };
  debug: boolean;
  acquireConnectionTimeout: number;
  asyncStackTraces: boolean;
  wrapIdentifier: (value: any, origImpl: any) => string;
  postProcessResponse: (result: any) => any;
  log: {
    warn: (message: any) => void;
    error: (message: any) => void;
    deprecate: (message: any) => void;
    debug: (message: any) => void;
  };
}

export default (): ProductionDatabaseConfig => {
  const env = cleanEnv(process.env, {
    PROD_DB_HOST: str({ default: "prod-db.example.com" }),
    PROD_DB_PORT: port({ default: 5432 }),
    PROD_DB_USER: str({ default: "prod_user" }),
    PROD_DB_PASSWORD: str({ default: "prod_password" }),
    PROD_DB_NAME: str({ default: "nest_app_prod" }),
    PROD_DB_SSL: str({ choices: ["true", "false"], default: "true" }),
    PROD_DB_SSL_REJECT_UNAUTHORIZED: str({
      choices: ["true", "false"],
      default: "true",
    }),
    PROD_DB_SSL_CA: str({ default: "" }),
    PROD_DB_SSL_KEY: str({ default: "" }),
    PROD_DB_SSL_CERT: str({ default: "" }),
    PROD_DB_STATEMENT_TIMEOUT: str({ default: "30000" }), // in ms
    PROD_DB_QUERY_TIMEOUT: str({ default: "60000" }), // in ms
    PROD_DB_CONNECTION_TIMEOUT: str({ default: "5000" }), // in ms
    PROD_DB_POOL_MIN: str({ default: "2" }),
    PROD_DB_POOL_MAX: str({ default: "20" }),
  });

  const config: ProductionDatabaseConfig = {
    client: "pg",
    connection: {
      host: env.PROD_DB_HOST,
      port: env.PROD_DB_PORT,
      user: env.PROD_DB_USER,
      password: env.PROD_DB_PASSWORD,
      database: env.PROD_DB_NAME,
      // Production SSL configuration (required)
      ssl:
        env.PROD_DB_SSL === "false"
          ? false
          : {
              rejectUnauthorized:
                env.PROD_DB_SSL_REJECT_UNAUTHORIZED !== "false",
              ca: env.PROD_DB_SSL_CA || undefined,
              key: env.PROD_DB_SSL_KEY || undefined,
              cert: env.PROD_DB_SSL_CERT || undefined,
            },
      // Production-specific connection options
      keepAlive: true,
      statement_timeout: parseInt(env.PROD_DB_STATEMENT_TIMEOUT, 10),
      query_timeout: parseInt(env.PROD_DB_QUERY_TIMEOUT, 10),
      connectionTimeoutMillis: parseInt(env.PROD_DB_CONNECTION_TIMEOUT, 10),
    },
    pool: {
      min: parseInt(env.PROD_DB_POOL_MIN, 10),
      max: parseInt(env.PROD_DB_POOL_MAX, 10),
      // Production pool timeouts
      acquireTimeoutMillis: 60000,
      createTimeoutMillis: 30000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 200,
      // Production-specific pool options
      propagateCreateError: false,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./src/database/migrations",
      // Production migration settings
      disableTransactions: false,
      loadExtensions: [".js"],
    },
    seeds: {
      directory: "./src/database/seeds",
      // Production seed settings (usually disabled)
      loadExtensions: [".js"],
    },
    // Production-specific configurations
    debug: false, // Always false in production
    acquireConnectionTimeout: 60000,
    asyncStackTraces: false, // Disabled for performance
    // Error handling
    wrapIdentifier: (value: any, origImpl: any) => origImpl(value),
    // Performance optimizations
    postProcessResponse: (result: any) => result,
    // Logging for production monitoring
    log: {
      warn(message: any) {
        console.warn("[DB WARNING]:", message);
      },
      error(message: any) {
        console.error("[DB ERROR]:", message);
      },
      deprecate(message: any) {
        console.warn("[DB DEPRECATED]:", message);
      },
      debug(message: any) {
        // Only log debug in development
        if (process.env.NODE_ENV !== "production") {
          console.debug("[DB DEBUG]:", message);
        }
      },
    },
  };

  return config;
};
// Previous hardcoded export, now replaced with validated config above
// export default {
//   client: 'pg',
//   connection: {
//     host: process.env.PROD_DB_HOST,
//     port: parseInt(process.env.PROD_DB_PORT || '5432', 10),
//     user: process.env.PROD_DB_USER,
//     password: process.env.PROD_DB_PASSWORD,
//     database: process.env.PROD_DB_NAME,
//     // Production SSL configuration (required)
//     ssl:
//       process.env.PROD_DB_SSL === 'false'
//         ? false
//         : {
//             rejectUnauthorized:
//               process.env.PROD_DB_SSL_REJECT_UNAUTHORIZED !== 'false',
//             ca: process.env.PROD_DB_SSL_CA,
//             key: process.env.PROD_DB_SSL_KEY,
//             cert: process.env.PROD_DB_SSL_CERT,
//           },
//     // Production-specific connection options
//     keepAlive: true,
//     statement_timeout: parseInt(
//       process.env.PROD_DB_STATEMENT_TIMEOUT || '30000',
//       10,
//     ),
//     query_timeout: parseInt(process.env.PROD_DB_QUERY_TIMEOUT || '60000', 10),
//     connectionTimeoutMillis: parseInt(
//       process.env.PROD_DB_CONNECTION_TIMEOUT || '5000',
//       10,
//     ),
//   },
//   pool: {
//     min: parseInt(process.env.PROD_DB_POOL_MIN || '2', 10),
//     max: parseInt(process.env.PROD_DB_POOL_MAX || '20', 10),
//     // Production pool timeouts
//     acquireTimeoutMillis: 60000,
//     createTimeoutMillis: 30000,
//     destroyTimeoutMillis: 5000,
//     idleTimeoutMillis: 30000,
//     reapIntervalMillis: 1000,
//     createRetryIntervalMillis: 200,
//     // Production-specific pool options
//     propagateCreateError: false,
//   },
//   migrations: {
//     tableName: 'knex_migrations',
//     directory: './src/database/migrations',
//     // Production migration settings
//     disableTransactions: false,
//     loadExtensions: ['.js'],
//   },
//   seeds: {
//     directory: './src/database/seeds',
//     // Production seed settings (usually disabled)
//     loadExtensions: ['.js'],
//   },
//   // Production-specific configurations
//   debug: false, // Always false in production
//   acquireConnectionTimeout: 60000,
//   asyncStackTraces: false, // Disabled for performance
//   // Error handling
//   wrapIdentifier: (value: any, origImpl: any) => origImpl(value),
//   // Performance optimizations
//   postProcessResponse: (result: any) => result,
//   // Logging for production monitoring
//   log: {
//     warn(message: any) {
//       console.warn('[DB WARNING]:', message);
//     },
//     error(message: any) {
//       console.error('[DB ERROR]:', message);
//     },
//     deprecate(message: any) {
//       console.warn('[DB DEPRECATED]:', message);
//     },
//     debug(message: any) {
//       // Only log debug in development
//       if (process.env.NODE_ENV !== 'production') {
//         console.debug('[DB DEBUG]:', message);
//       }
//     },
//   },
// };
```

src/config/local/database.ts

```typescript
import { cleanEnv, str, port } from "envalid";

/**
 * Local Database Configuration
 * Connects to LOCAL PostgreSQL in Docker container
 *
 * NOTE: This is for local development with PostgreSQL running in Docker.
 * Use NODE_ENV=local to activate this configuration.
 */

export interface LocalDatabaseConfig {
  client: "pg";
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl: boolean | { rejectUnauthorized: boolean };
  };
  pool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
  migrations: {
    tableName: string;
    directory: string;
  };
  seeds: {
    directory: string;
  };
  debug: boolean;
  acquireConnectionTimeout: number;
  asyncStackTraces: boolean;
}

export default (): LocalDatabaseConfig => {
  const env = cleanEnv(process.env, {
    LOCAL_DB_HOST: str({ default: "postgresql" }), // Docker service name
    LOCAL_DB_PORT: port({ default: 5432 }),
    LOCAL_DB_USER: str({ default: "nest_user" }),
    LOCAL_DB_PASSWORD: str({ default: "nest_password" }),
    LOCAL_DB_NAME: str({ default: "nest_app" }),
  });

  const config: LocalDatabaseConfig = {
    client: "pg",
    connection: {
      host: env.LOCAL_DB_HOST,
      port: env.LOCAL_DB_PORT,
      user: env.LOCAL_DB_USER,
      password: env.LOCAL_DB_PASSWORD,
      database: env.LOCAL_DB_NAME,
      // No SSL for local Docker connection
      ssl: false,
    },
    pool: {
      min: 2,
      max: 10,
      // Local connection timeout settings (faster for local)
      acquireTimeoutMillis: 10000,
      createTimeoutMillis: 10000,
      destroyTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
      reapIntervalMillis: 1000,
      createRetryIntervalMillis: 100,
    },
    migrations: {
      tableName: "knex_migrations",
      directory: "./src/database/migrations",
    },
    seeds: {
      directory: "./src/database/seeds",
    },
    // Debug mode (useful for development)
    debug: process.env.DB_DEBUG === "true",
    acquireConnectionTimeout: 60000,
    // Enable async stack traces for better debugging
    asyncStackTraces: true,
  };

  return config;
};

// Previous hardcoded export, now replaced with validated config above
// export default {
//   client: 'pg',
//   connection: {
//     host: process.env.LOCAL_DB_HOST || 'postgresql', // Docker service name
//     port: parseInt(process.env.LOCAL_DB_PORT || '5432', 10),
//     user: process.env.LOCAL_DB_USER || 'nest_user',
//     password: process.env.LOCAL_DB_PASSWORD || 'nest_password',
//     database: process.env.LOCAL_DB_NAME || 'nest_app',
//     // No SSL for local Docker connection
//     ssl: false,
//   },
//   pool: {
//     min: 2,
//     max: 10,
//     // Local connection timeout settings (faster for local)
//     acquireTimeoutMillis: 10000,
//     createTimeoutMillis: 10000,
//     destroyTimeoutMillis: 5000,
//     idleTimeoutMillis: 30000,
//     reapIntervalMillis: 1000,
//     createRetryIntervalMillis: 100,
//   },
//   migrations: {
//     tableName: 'knex_migrations',
//     directory: './src/database/migrations',
//   },
//   seeds: {
//     directory: './src/database/seeds',
//   },
//   // Debug mode (useful for development)
//   debug: process.env.DB_DEBUG === 'true',
//   acquireConnectionTimeout: 60000,
//   // Enable async stack traces for better debugging
//   asyncStackTraces: true,
// };
```

src/config/database.config.ts

```typescript
import { registerAs } from "@nestjs/config";
import { cleanEnv, str } from "envalid";
import localConfig from "./local/database";
import developmentConfig from "./development/database";
import productionConfig from "./production/database";

export interface DatabaseConfig {
  client: "pg";
  connection: {
    host: string;
    port: number;
    user: string;
    password: string;
    database: string;
    ssl: boolean | { rejectUnauthorized: boolean };
  };
  pool: {
    min: number;
    max: number;
    acquireTimeoutMillis: number;
    createTimeoutMillis: number;
    destroyTimeoutMillis: number;
    idleTimeoutMillis: number;
    reapIntervalMillis: number;
    createRetryIntervalMillis: number;
  };
  migrations: {
    tableName: string;
    directory: string;
  };
  seeds: {
    directory: string;
  };
  debug: boolean;
  acquireConnectionTimeout: number;
  asyncStackTraces: boolean;
}

const getDatabaseConfig = (): DatabaseConfig => {
  // Validate NODE_ENV
  const env = cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ["local", "development", "production"],
      default: "local",
    }),
  });

  const environment = env.NODE_ENV;

  const configurations: Record<string, DatabaseConfig> = {
    local: localConfig(),
    development: developmentConfig(),
    production: productionConfig(),
  };

  const config = configurations[environment] || configurations.local;

  console.log(`Loading database configuration for environment: ${environment}`);

  return config;
};
export default registerAs("database", getDatabaseConfig);

// const getConnectionConfig = () => {
//   const environment = process.env.NODE_ENV || 'local';

//   const configurations: Record<string, any> = {
//     local: localConfig,
//     development: developmentConfig,
//     production: productionConfig,
//   };

//   const config = configurations[environment] || configurations.local;

//   console.log(`Loading database configuration for environment: ${environment}`);

//   return config;
// };

// export default registerAs('database', getConnectionConfig);
```

src/config/logger.config.ts

```typescript
import { registerAs } from "@nestjs/config";
import { cleanEnv, str } from "envalid";

export enum LoggerFormat {
  Json = "json",
  Pretty = "pretty",
}

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
    bindings: (bindings: any) => { pid: number; hostname: string };
  };
}

const getLoggerConfig = (): LoggerConfig => {
  // Validate environment variables
  const env = cleanEnv(process.env, {
    LOG_LEVEL: str({
      choices: ["error", "warn", "info", "debug", "verbose"],
      default: "info",
      desc: "Logging level",
    }),
    LOG_FORMAT: str({
      choices: ["json", "pretty"],
      default: "pretty",
      desc: "Logging format",
    }),
  });

  const config: LoggerConfig = {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT as LoggerFormat,

    // Pretty format configuration
    prettyOptions: {
      colorize: true,
      levelFirst: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
      ignore: "pid,hostname,req,res",
      messageFormat: "{method} {url} {msg} - {res.statusCode}",
    },

    // JSON format configuration
    jsonOptions: {
      colorize: false,
      levelFirst: false,
      translateTime: false,
    },

    // Log formatters
    formatters: {
      level: (label: string) => ({
        level: `${label.toUpperCase()}`,
      }),
      bindings: (bindings: any) => ({
        pid: bindings.pid,
        hostname: bindings.hostname,
      }),
    },
  };

  return config;
};

export default registerAs("logger", getLoggerConfig);
```

src/config/index.ts

```typescript
// Main App Configuration - Combines all validated sub-configurations
import { cleanEnv, str, port } from "envalid";

// Import individual validated configurations
import databaseConfigFactory, { DatabaseConfig } from "./database.config";
import redisConfigFactory, { RedisConfig } from "./redis.config";
import loggerConfigFactory, {
  LoggerConfig,
  LoggerFormat,
} from "./logger.config";
import serviceConfigFactory, { ServiceConfig } from "./service.config";
import googleTranslateConfigFactory, {
  GoogleTranslateConfig,
} from "./google-translate.config";
import minioConfigFactory, { MinioConfig } from "./minio.config";

export {
  LoggerFormat,
  DatabaseConfig,
  RedisConfig,
  LoggerConfig,
  ServiceConfig,
  GoogleTranslateConfig,
  MinioConfig,
};

export enum NodeEnv {
  Local = "local",
  Development = "development",
  Production = "production",
}

export interface AppConfig {
  nodeEnv: NodeEnv;
  port: number;
  database: DatabaseConfig;
  redis: RedisConfig;
  logger: LoggerConfig;
  googleTranslate: GoogleTranslateConfig;
  service: ServiceConfig;
  minio: MinioConfig;
  isLocalEnv: boolean;
  isDevelopmentEnv: boolean;
  isProductionEnv: boolean;
}

export default (): AppConfig => {
  // Validate core application environment variables
  const env = cleanEnv(process.env, {
    NODE_ENV: str({
      choices: ["local", "development", "production"],
      default: "local",
    }),
    PORT: port({ default: 3004 }),
  });

  const nodeEnv = env.NODE_ENV as NodeEnv;

  // Get validated configurations from individual config modules
  const database = databaseConfigFactory();
  const redis = redisConfigFactory();
  const logger = loggerConfigFactory();
  const service = serviceConfigFactory();
  const googleTranslate = googleTranslateConfigFactory();
  const minio = minioConfigFactory();

  const config: AppConfig = {
    nodeEnv,
    port: env.PORT,
    database,
    redis,
    logger,
    service,
    googleTranslate,
    minio,
    isLocalEnv: nodeEnv === NodeEnv.Local,
    isDevelopmentEnv: nodeEnv === NodeEnv.Development,
    isProductionEnv: nodeEnv === NodeEnv.Production,
  };

  console.log(
    `✅ Application configuration loaded successfully for environment: ${nodeEnv}`,
  );

  return config;
};
```

src/database/index.ts (gabungan dari dua file ini. tolong disesuaikan)

```typescript
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseService } from "./database.service";
import databaseConfig from "../config/database.config";

@Module({
  imports: [ConfigModule.forFeature(databaseConfig)],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}

import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Knex, knex } from "knex";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private knexInstance: Knex;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    const databaseConfig = this.configService.get("database");
    this.knexInstance = knex(databaseConfig);

    // Test the connection
    try {
      await this.knexInstance.raw("SELECT 1");
      console.log("Database connected successfully");
    } catch (error) {
      console.error("Database connection failed:", error);
    }
  }

  async onModuleDestroy() {
    if (this.knexInstance) {
      await this.knexInstance.destroy();
    }
  }

  getKnex(): Knex {
    return this.knexInstance;
  }
}
```

src/knexfile.js

```javascript
require("dotenv").config();

// Import environment-specific database configurations
const localConfig = require("./src/config/local/database.ts").default;
const developmentConfig =
  require("./src/config/development/database.ts").default;
const productionConfig = require("./src/config/production/database.ts").default;

module.exports = {
  local: localConfig(),
  development: developmentConfig(),
  production: productionConfig(),
};
```

src/main.ts untuk file ini abaikan swagger docsnya

```typescript
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { I18nValidationPipe } from "nestjs-i18n";
import { AppModule } from "./app.module";
import { Logger } from "nestjs-pino";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
    snapshot: true,
  });

  const configService: ConfigService = await app.get(ConfigService);

  const logger = app.get(Logger);
  app.useLogger(logger);

  // Multer configuration handled by FileInterceptor in controllers
  // app.use(multer().any()); // Commented  out to avoid conflicts with FileInterceptor
  // Enable i18n validation pipes globally
  app.useGlobalPipes(
    new I18nValidationPipe({
      transform: true, // Automatically transforms request data to DTO instances
      whitelist: true, // Strips properties that are not defined in the DTO
      forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
    }),
  );

  // Note: Global interceptors and filters are registered in common.module.ts
  // using APP_INTERCEPTOR and APP_FILTER tokens for proper dependency injection

  // Setup Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle("Auto-CRUD API")
    .setDescription(
      "Laravel-inspired Auto-CRUD system with NestJS - Complete API documentation for all endpoints including standard CRUD operations, custom business logic, and utility endpoints",
    )
    .setVersion("1.0")
    .addBearerAuth(
      {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        name: "JWT",
        description: "Enter JWT token",
        in: "header",
      },
      "JWT-auth",
    )
    .addTag("products", "Product management endpoints")
    .addTag("Auth", "Authentication endpoints")
    .addTag("Groups", "Group management endpoints with Keycloak integration")
    .addTag(
      "Public Applications",
      "Public application listing endpoints (no authentication required for list)",
    )
    .addServer(`http://localhost:${configService.get("PORT")}`, "Local server")
    .addServer("http://api-myservicedesk.upnvj.local", "Local Domain server")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Fix for multipart/form-data display in Swagger UI
  if (
    document.paths &&
    document.paths["/v1/products"] &&
    document.paths["/v1/products"]["post"]
  ) {
    const postEndpoint = document.paths["/v1/products"]["post"];

    // Add x-lang header parameter
    if (!postEndpoint.parameters) postEndpoint.parameters = [];

    postEndpoint.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Product name",
                example: "iPhone 15 Pro",
              },
              description: {
                type: "string",
                description: "Product description (optional)",
                example: "Latest iPhone with advanced camera",
              },
              price: {
                type: "number",
                description: "Product price",
                example: 1199.99,
                minimum: 0,
              },
              stock_quantity: {
                type: "number",
                description: "Stock quantity",
                example: 50,
                minimum: 0,
              },
              category: {
                type: "string",
                description: "Product category (optional)",
                example: "Electronics",
              },
              image: {
                type: "string",
                format: "binary",
                description: "Product image file (REQUIRED)",
              },
            },
            required: ["name", "price", "stock_quantity", "image"],
          },
        },
      },
    };
  }

  // Fix for PUT /v1/products/{id} multipart/form-data display
  if (
    document.paths &&
    document.paths["/v1/products/{id}"] &&
    document.paths["/v1/products/{id}"]["put"]
  ) {
    const putEndpoint = document.paths["/v1/products/{id}"]["put"];

    putEndpoint.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              name: {
                type: "string",
                description: "Product name (optional)",
                example: "iPhone 15 Pro Updated",
              },
              description: {
                type: "string",
                description: "Product description (optional)",
                example: "Updated iPhone with enhanced features",
              },
              price: {
                type: "number",
                description: "Product price (optional)",
                example: 1299.99,
                minimum: 0,
              },
              stock_quantity: {
                type: "number",
                description: "Stock quantity (optional)",
                example: 45,
                minimum: 0,
              },
              category: {
                type: "string",
                description: "Product category (optional)",
                example: "Electronics",
              },
              image: {
                type: "string",
                format: "binary",
                description:
                  "Product image file (optional - replaces existing image)",
              },
            },
            required: [],
          },
        },
      },
    };
  }

  // Fix for POST /v1/applications/init multipart/form-data display (logo upload)
  if (
    document.paths &&
    document.paths["/v1/applications/init"] &&
    document.paths["/v1/applications/init"]["post"]
  ) {
    const appPostEndpoint = document.paths["/v1/applications/init"]["post"];

    appPostEndpoint.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              application_code: {
                type: "string",
                description:
                  "Application code (lowercase letters and hyphens only)",
                example: "aplikasi-mahasiswa",
              },
              application_name: {
                type: "string",
                description: "Application name in Indonesian (max 100 chars)",
                example: "Aplikasi Mahasiswa UPNVJ",
              },
              application_name_english: {
                type: "string",
                description: "Application name in English (max 100 chars)",
                example: "Student Application UPNVJ",
              },
              application_description: {
                type: "string",
                description:
                  "Application description (max 500 chars, optional)",
                example: "Aplikasi untuk mengelola data mahasiswa dan akademik",
              },
              application_active_menu: {
                type: "boolean",
                description: "Whether menu is active (optional)",
                example: true,
              },
              application_category: {
                type: "string",
                format: "uuid",
                description:
                  "Application category UUID from kategori_aplikasi table",
                example: "bf31b43b-d7e5-412d-80ff-67c039faed88",
              },
              application_type: {
                type: "string",
                format: "uuid",
                description: "Application type UUID from tipe_aplikasi table",
                example: "96a00d5a-28b7-45b7-b3b7-8010a7dc24da",
              },
              logo: {
                type: "string",
                format: "binary",
                description:
                  "Application logo image (optional, max 5MB, jpeg/png/webp)",
              },
            },
            required: [
              "application_code",
              "application_name",
              "application_name_english",
              "application_category",
              "application_type",
            ],
          },
        },
      },
    };
  }

  // Fix for PUT /v1/applications/finalize/{clientId} multipart/form-data display (application_logo upload)
  if (
    document.paths &&
    document.paths["/v1/applications/finalize/{clientId}"] &&
    document.paths["/v1/applications/finalize/{clientId}"]["put"]
  ) {
    const appFinalizeEndpoint =
      document.paths["/v1/applications/finalize/{clientId}"]["put"];

    appFinalizeEndpoint.requestBody = {
      required: true,
      content: {
        "multipart/form-data": {
          schema: {
            type: "object",
            properties: {
              application_name: {
                type: "string",
                description:
                  "Application display name (optional, max 100 characters)",
                example: "My Office Frontend",
              },
              application_name_english: {
                type: "string",
                description:
                  "Application name in English (optional, max 100 characters)",
                example: "My Office Frontend",
              },
              application_description: {
                type: "string",
                description:
                  "Application description (optional, max 500 chars)",
                example: "Frontend application for My Office system",
              },
              application_login_theme: {
                type: "string",
                description: "Login theme (optional)",
                example: "myauth-keycloak-theme",
              },
              application_root_url: {
                type: "string",
                description: "Root URL for the application (optional)",
                example: "https://myoffice.upnvj.ac.id",
              },
              application_base_url: {
                type: "string",
                description: "Base URL path for the application (optional)",
                example: "/",
              },
              application_admin_url: {
                type: "string",
                description: "Admin URL for backchannel operations (optional)",
                example: "https://myoffice.upnvj.ac.id/admin",
              },
              application_redirect_uris: {
                type: "array",
                items: { type: "string" },
                description: "Valid redirect URIs for OAuth2 flows (optional)",
                example: ["https://myoffice.upnvj.ac.id/*"],
              },
              application_web_origins: {
                type: "array",
                items: { type: "string" },
                description: "Allowed web origins for CORS (optional)",
                example: ["https://myoffice.upnvj.ac.id"],
              },
              application_logo: {
                type: "string",
                format: "binary",
                description:
                  "Application logo image (optional, max 5MB, jpeg/png/webp)",
              },
            },
            required: [],
          },
        },
      },
    };
  }

  // Fix for GET /v1/products query parameters display
  if (
    document.paths &&
    document.paths["/v1/products"] &&
    document.paths["/v1/products"]["get"]
  ) {
    const getEndpoint = document.paths["/v1/products"]["get"];

    // Ensure query parameters are properly defined
    getEndpoint.parameters = [
      {
        name: "page",
        in: "query",
        required: false,
        description: "Page number for pagination",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
          example: 1,
        },
      },
      {
        name: "limit",
        in: "query",
        required: false,
        description: "Number of items per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 10,
          example: 10,
        },
      },
      {
        name: "category",
        in: "query",
        required: false,
        description: "Filter products by category (exact match)",
        schema: {
          type: "string",
          example: "Electronics",
        },
      },
      {
        name: "name",
        in: "query",
        required: false,
        description:
          "Search products by name (partial match, case-insensitive)",
        schema: {
          type: "string",
          example: "iPhone",
        },
      },
      {
        name: "minPrice",
        in: "query",
        required: false,
        description: "Minimum price filter (inclusive)",
        schema: {
          type: "number",
          minimum: 0,
          example: 100.0,
        },
      },
      {
        name: "maxPrice",
        in: "query",
        required: false,
        description: "Maximum price filter (inclusive)",
        schema: {
          type: "number",
          minimum: 0,
          example: 2000.0,
        },
      },
      {
        name: "x-lang",
        in: "header",
        required: false,
        description: "Language preference (en or id)",
        schema: {
          type: "string",
          enum: ["en", "id"],
          default: "en",
          example: "en",
        },
      },
    ];
  }

  SwaggerModule.setup("api-docs", app, document, {
    customSiteTitle: "Auto-CRUD API Documentation",
    customfavIcon: "https://nestjs.com/img/logo_text.svg",
    customCss: `
      .topbar-wrapper .link {
        content: url('https://nestjs.com/img/logo_text.svg');
        width: 120px;
        height: auto;
      }
      .swagger-ui .topbar { background-color: #e10e49; }
    `,
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
      filter: true,
      showExtensions: true,
      showCommonExtensions: true,
    },
  });

  await app.listen(process.env.PORT ?? 3004);
  logger.log(
    `🚀 Application is running on: http://localhost:${process.env.PORT ?? 3004}`,
  );
  logger.log(
    `📚 Swagger API Documentation available at: http://localhost:${
      process.env.PORT ?? 3004
    }/api-docs`,
  );
}

void bootstrap();
```

src/package.json

```json
{
  "name": "nest-getting-started",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:unit": "jest --testPathPatterns=__tests__",
    "test:unit:domain": "jest --testPathPatterns=src/domains/.*/__tests__",
    "test:integration": "jest --testPathPatterns=test/integration",
    "test:e2e": "jest --testPathPatterns=test/e2e",
    "test:watch": "jest --watch --testPathPatterns=__tests__",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:products": "jest --testPathPatterns=products",
    "db:migrate": "knex migrate:latest",
    "db:migrate:rollback": "knex migrate:rollback",
    "db:seed": "knex seed:run",
    "db:reset": "knex migrate:rollback --all && knex migrate:latest && knex seed:run",
    "dev:local": "NODE_ENV=local npm run start:dev",
    "dev:remote": "NODE_ENV=development npm run start:dev",
    "db:migrate:dev": "NODE_ENV=development knex migrate:latest",
    "db:seed:dev": "NODE_ENV=development knex seed:run",
    "db:reset:dev": "NODE_ENV=development knex migrate:rollback --all && NODE_ENV=development knex migrate:latest && NODE_ENV=development knex seed:run"
  },
  "dependencies": {
    "@nestjs/common": "^11.1.6",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.1.6",
    "@nestjs/mapped-types": "*",
    "@nestjs/platform-express": "^11.1.6",
    "@nestjs/swagger": "^8.0.0",
    "@types/multer": "^2.0.0",
    "@upa-tik/minio": "^1.0.0",
    "bcrypt": "^6.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.2",
    "dotenv": "^17.2.1",
    "envalid": "^8.1.0",
    "ioredis": "^5.8.1",
    "jose": "^6.0.13",
    "knex": "^3.1.0",
    "minio": "^8.0.7",
    "multer": "^2.0.2",
    "nestjs-i18n": "^10.5.1",
    "nestjs-minio": "^2.6.3",
    "nestjs-pino": "^4.4.1",
    "pg": "^8.13.1",
    "pino": "^10.0.0",
    "pino-pretty": "^13.1.2",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "uuid": "^11.0.4"
  },
  "devDependencies": {
    "@angular-devkit/schematics-cli": "^19.0.0",
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/bcrypt": "^6.0.0",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.10.7",
    "@types/pg": "^8.11.10",
    "@types/supertest": "^6.0.2",
    "@types/uuid": "^10.0.0",
    "@upa-tik/schematics": "^1.0.5",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^16.0.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0"
  },
  "jest": {
    "moduleFileExtensions": ["js", "json", "ts"],
    "rootDir": ".",
    "testMatch": [
      "<rootDir>/src/**/__tests__/**/*.spec.ts",
      "<rootDir>/test/integration/**/*.spec.ts",
      "<rootDir>/test/e2e/**/*.e2e-spec.ts"
    ],
    "transform": {
      "^.+\\.(t|j)s$": [
        "ts-jest",
        {
          "useESM": true
        }
      ]
    },
    "collectCoverageFrom": [
      "src/**/*.(t|j)s",
      "!src/**/__tests__/**",
      "!src/**/__mocks__/**",
      "!src/**/*.spec.ts",
      "!src/**/*.d.ts"
    ],
    "coverageDirectory": "coverage",
    "testEnvironment": "node",
    "testPathIgnorePatterns": ["/node_modules/", "/dist/", "/__mocks__/"],
    "transformIgnorePatterns": ["node_modules/(?!(.pnpm/jose@|jose))"],
    "moduleNameMapper": {
      "^@/(.*)$": "<rootDir>/src/$1"
    },
    "extensionsToTreatAsEsm": [".ts"],
    "preset": "ts-jest/presets/default-esm"
  }
}
```

src/eslint.config.mjs

```mjs
// @ts-check
import eslint from "@eslint/js";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["eslint.config.mjs", "dist/**", "node_modules/**", "build/**"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  eslintPluginPrettierRecommended,
  {
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      },
      sourceType: "module",
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-unsafe-argument": "off",
      "@typescript-eslint/no-unsafe-assignment": "off",
      "@typescript-eslint/no-unsafe-member-access": "off",
      "@typescript-eslint/no-unsafe-call": "off",
      "@typescript-eslint/no-unsafe-return": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          ignoreRestSiblings: true,
        },
      ],
      "@typescript-eslint/require-await": "off",
      "prettier/prettier": [
        "error",
        {
          endOfLine: "auto",
          semi: true,
          singleQuote: true,
          trailingComma: "all",
          tabWidth: 2,
          printWidth: 80,
        },
      ],
    },
  },
);
```

src/.prettierrc

```json
{
  "singleQuote": true,
  "trailingComma": "all"
}
```

src/tsconfig.json

```json
{
  "compilerOptions": {
    "module": "commonjs",
    "moduleResolution": "node",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "esModuleInterop": true,
    "target": "ES2022",
    "lib": ["ES2022"],
    "sourceMap": true,
    "outDir": "dist",
    "baseUrl": "./",
    "rootDir": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strictNullChecks": true,
    "forceConsistentCasingInFileNames": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "noFallthroughCasesInSwitch": true,
    "resolveJsonModule": true,
    "typeRoots": ["./node_modules/@types"],
    "types": ["node", "jest"],
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*", "test/**/*", "knexfile.js", "examples/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

src/tsconfig.build.json

```json
{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}
```

src/config/logger.config.ts

```typescript
import { registerAs } from "@nestjs/config";
import { cleanEnv, str } from "envalid";

export enum LoggerFormat {
  Json = "json",
  Pretty = "pretty",
}

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
    bindings: (bindings: any) => { pid: number; hostname: string };
  };
}

const getLoggerConfig = (): LoggerConfig => {
  // Validate environment variables
  const env = cleanEnv(process.env, {
    LOG_LEVEL: str({
      choices: ["error", "warn", "info", "debug", "verbose"],
      default: "info",
      desc: "Logging level",
    }),
    LOG_FORMAT: str({
      choices: ["json", "pretty"],
      default: "pretty",
      desc: "Logging format",
    }),
  });

  const config: LoggerConfig = {
    level: env.LOG_LEVEL,
    format: env.LOG_FORMAT as LoggerFormat,

    // Pretty format configuration
    prettyOptions: {
      colorize: true,
      levelFirst: true,
      translateTime: "SYS:yyyy-mm-dd HH:MM:ss",
      ignore: "pid,hostname,req,res",
      messageFormat: "{method} {url} {msg} - {res.statusCode}",
    },

    // JSON format configuration
    jsonOptions: {
      colorize: false,
      levelFirst: false,
      translateTime: false,
    },

    // Log formatters
    formatters: {
      level: (label: string) => ({
        level: `${label.toUpperCase()}`,
      }),
      bindings: (bindings: any) => ({
        pid: bindings.pid,
        hostname: bindings.hostname,
      }),
    },
  };

  return config;
};

export default registerAs("logger", getLoggerConfig);
```

</context>

<role>
You are a senior backend engineer responsible for all of the code in this project. You have access to the entire codebase for this project and you know this project inside and out. You understand the data flow and how responses and requests are processed in this project. Because you are the thorough person, you will always analyze the codebase before you start the action.
</role>

<action>
Considering the existing context, create the best technical solution to overcome this problem or do your work, including:
1. Create new branch from current branch. The new branch name should follow the convention that being used in this project. After that, working on that branch.
2. Create a plan by looking at the bigger picture, from incoming requests to outgoing responses.
3. When create the technical plan, outline the function (method) signature, data types, flow data, and step-by-step logic without code implementation. This is means you need create the technical plan very detail into the smallest detail. I want you to create a diagram to show the flow of data and the flow of logic.
4. Ensure that the code is sustainable, maintainable, reusable, and modular.
5. Ensure that the code follows the SOLID, DRY, KISS, and YAGNI principles.
6. Think in terms of the system to ensure and identify the interrelationships between files and the possibility of break changes that may occur.
7. Analyze the codebase to understand the architecture and data flow of this project.
8. If possible, always use left join instead of inner join.
9. Ensure that the code is secure and follows the best practices for security.
10. If using try catch, the catch block should be used to handle errors and the try block should be used to handle business logic.
</action>
