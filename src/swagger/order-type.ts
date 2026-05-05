const bearerSecurity = [{ bearerAuth: [] }];

const orderTypeResponseSchema = {
  type: 'object',
  properties: {
    order_type_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440001',
    },
    order_type_name: { type: 'string', example: 'Dine In' },
    order_type_code: { type: 'string', example: 'DINE_IN' },
  },
};

const unauthorizedResponse = {
  description: 'Token autentikasi tidak ada atau tidak valid',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'AUTH_TOKEN_MISSING',
                enum: [
                  'AUTH_TOKEN_MISSING',
                  'AUTH_TOKEN_EXPIRED',
                  'AUTH_TOKEN_INVALID',
                ],
              },
              message: {
                type: 'string',
                example: 'Token autentikasi tidak ditemukan',
              },
            },
          },
        },
      },
    },
  },
};

const forbiddenResponse = {
  description: 'Tidak memiliki permission yang dibutuhkan',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'AUTH_FORBIDDEN' },
              message: {
                type: 'string',
                example: 'Anda tidak memiliki akses ke resource ini',
              },
            },
          },
        },
      },
    },
  },
};

const validationErrorResponse = {
  description: 'Validasi request gagal',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'VALIDATION_FAILED' },
              message: {
                type: 'string',
                example: 'Request validation failed',
              },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
  },
};

const internalServerErrorResponse = {
  description: 'Kesalahan internal server',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'INTERNAL_SERVER_ERROR' },
              message: {
                type: 'string',
                example: 'Terjadi kesalahan internal',
              },
            },
          },
        },
      },
    },
  },
};

export const orderTypeSwaggerDoc = {
  tags: [
    {
      name: 'Order Types',
      description: 'Manajemen tipe order — daftar tipe pesanan',
    },
  ],
  paths: {
    '/v1/order-types': {
      get: {
        tags: ['Order Types'],
        summary: 'Ambil daftar tipe order',
        description:
          'Mengambil daftar tipe order dengan dukungan pagination. Membutuhkan permission `order_type:read`.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'page',
            in: 'query',
            required: false,
            description: 'Nomor halaman (default: 1, minimal: 1)',
            schema: { type: 'integer', minimum: 1, default: 1, example: 1 },
          },
          {
            name: 'limit',
            in: 'query',
            required: false,
            description:
              'Jumlah data per halaman (default: 10, minimal: 1, maksimal: 100)',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: 100,
              default: 10,
              example: 10,
            },
          },
        ],
        responses: {
          '200': {
            description: 'Daftar tipe order berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Data tipe pesanan berhasil diambil',
                    },
                    data: {
                      type: 'array',
                      items: orderTypeResponseSchema,
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        total: { type: 'integer', example: 2 },
                        totalPages: { type: 'integer', example: 1 },
                      },
                    },
                  },
                },
              },
            },
          },
          '400': validationErrorResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
  },
};
