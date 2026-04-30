export const healthSwaggerDoc = {
  tags: [
    {
      name: 'Health',
      description: 'Service health and database connectivity checks',
    },
  ],
  paths: {
    '/v1/health': {
      get: {
        tags: ['Health'],
        summary: 'Get service health status',
        description: 'Returns API and database health information.',
        responses: {
          '200': {
            description: 'Service and database are healthy',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'ok' },
                        db: { type: 'string', example: 'ok' },
                        durationMs: { type: 'number', example: 8 },
                        timestamp: {
                          type: 'string',
                          format: 'date-time',
                          example: '2026-04-30T08:59:05.000Z',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '503': {
            description: 'Database is unavailable',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: {
                      type: 'object',
                      properties: {
                        code: { type: 'string', example: 'DATABASE_UNAVAILABLE' },
                        message: { type: 'string', example: 'Database unavailable' },
                      },
                    },
                    data: {
                      type: 'object',
                      properties: {
                        status: { type: 'string', example: 'degraded' },
                        db: { type: 'string', example: 'down' },
                        durationMs: { type: 'number', example: 14 },
                        timestamp: {
                          type: 'string',
                          format: 'date-time',
                          example: '2026-04-30T08:59:12.000Z',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
};
