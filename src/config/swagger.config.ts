import fs from 'node:fs';
import path from 'node:path';
import type { Express } from 'express';
import swaggerUi from 'swagger-ui-express';
import type { AppConfig } from './index';
import { healthSwaggerDoc } from '../swagger/health.swagger';
import { ordersSwaggerDoc } from '../swagger/orders.swagger';
import { authSwaggerDoc } from '../swagger/auth.swagger';
import { businessUnitsSwaggerDoc } from '../swagger/business-units.swagger';
import { roleSwaggerDoc } from '../swagger/role.swagger';

interface PackageMetadata {
  name?: string;
  version?: string;
}

interface SwaggerSetupOptions {
  uiPath: string;
  jsonPath: string;
}

interface SwaggerRouteDoc {
  tags?: Array<{ name: string; description?: string }>;
  paths: Record<string, unknown>;
}

const getPackageMetadata = (): PackageMetadata => {
  try {
    const packageJsonPath = path.resolve(process.cwd(), 'package.json');
    const raw = fs.readFileSync(packageJsonPath, 'utf-8');
    const parsed = JSON.parse(raw) as PackageMetadata;

    return {
      name: parsed.name,
      version: parsed.version,
    };
  } catch {
    return {};
  }
};

const mergeRouteDocs = (
  docs: SwaggerRouteDoc[],
): {
  tags: Array<{ name: string; description?: string }>;
  paths: Record<string, unknown>;
} => {
  const tags = new Map<string, { name: string; description?: string }>();
  const paths: Record<string, unknown> = {};

  for (const doc of docs) {
    if (doc.tags) {
      for (const tag of doc.tags) {
        tags.set(tag.name, tag);
      }
    }

    Object.assign(paths, doc.paths);
  }

  return { tags: Array.from(tags.values()), paths };
};

const buildOpenApiDocument = () => {
  const packageMetadata = getPackageMetadata();
  const routeDocs = [
    healthSwaggerDoc,
    ordersSwaggerDoc,
    authSwaggerDoc,
    businessUnitsSwaggerDoc,
    roleSwaggerDoc,
  ];
  const { tags, paths } = mergeRouteDocs(routeDocs);

  return {
    openapi: '3.0.3',
    info: {
      title: packageMetadata.name ?? 'API',
      version: packageMetadata.version ?? '1.0.0',
      description: 'OpenAPI documentation for current API routes.',
    },
    tags,
    paths,
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  };
};

export const setupSwagger = (
  app: Express,
  config: AppConfig,
  options: SwaggerSetupOptions = {
    uiPath: '/api-docs',
    jsonPath: '/api-docs.json',
  },
): void => {
  const isSwaggerEnabled = config.isLocalEnv || config.isDevelopmentEnv;
  if (!isSwaggerEnabled) {
    return;
  }

  const openApiDocument = buildOpenApiDocument();

  app.get(options.jsonPath, (_req, res) => {
    res.type('application/json').send(openApiDocument);
  });
  app.use(options.uiPath, swaggerUi.serve, swaggerUi.setup(openApiDocument));
};
