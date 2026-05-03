const menuCategoryResponseSchema = {
  type: 'object',
  properties: {
    menu_category_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    menu_category_name: { type: 'string', example: 'Makanan' },
    description: { type: 'string', example: 'Kategori untuk makanan' },
    business_unit_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    business_unit_name: { type: 'string', example: 'Restoran ABC' },
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

const bearerSecurity = [{ bearerAuth: [] }];

export const menuCategorySwaggerDoc = {
  tags: [
    {
      name: 'Menu Categories',
      description: 'Manajemen kategori menu — CRUD dan statistik',
    },
  ],
  paths: {
    '/v1/menu-categories': {
      get: {
        tags: ['Menu Categories'],
        summary: 'Ambil daftar kategori menu',
        description:
          'Mengambil daftar kategori menu dengan dukungan pagination. Membutuhkan permission `menu_category:read`.',
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
          {
            name: 'business_unit_id',
            in: 'query',
            required: false,
            description: 'Filter kategori menu berdasarkan business unit ID',
            schema: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Daftar kategori menu berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Data kategori menu berhasil diambil',
                    },
                    data: {
                      type: 'array',
                      items: menuCategoryResponseSchema,
                    },
                    meta: {
                      type: 'object',
                      properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 10 },
                        total: { type: 'integer', example: 25 },
                        totalPages: { type: 'integer', example: 3 },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
  },
};
