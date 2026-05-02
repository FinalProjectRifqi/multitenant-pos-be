const roleResponseSchema = {
  type: 'object',
  properties: {
    role_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    role_name: { type: 'string', example: 'Manajemen Grup' },
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

const notFoundResponse = {
  description: 'Peran tidak ditemukan',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'ROLE_NOT_FOUND' },
              message: {
                type: 'string',
                example: 'Peran tidak ditemukan',
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

// const validationErrorResponse = {
//   description: 'Validasi request gagal',
//   content: {
//     'application/json': {
//       schema: {
//         type: 'object',
//         properties: {
//           success: { type: 'boolean', example: false },
//           error: {
//             type: 'object',
//             properties: {
//               code: { type: 'string', example: 'VALIDATION_FAILED' },
//               message: { type: 'string', example: 'Request validation failed' },
//               details: { type: 'array', items: { type: 'object' } },
//             },
//           },
//         },
//       },
//     },
//   },
// };

const bearerSecurity = [{ bearerAuth: [] }];

export const roleSwaggerDoc = {
  tags: [
    {
      name: 'Roles',
      description: 'Manajemen peran — CRUD dan statistik',
    },
  ],
  paths: {
    '/v1/roles': {
      get: {
        tags: ['Roles'],
        summary: 'Ambil daftar peran',
        description:
          'Mengambil daftar peran dengan dukungan pencarian, filter status, dan pagination. Membutuhkan permission `role:read`.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'search',
            in: 'query',
            required: false,
            description:
              'Kata kunci pencarian pada nama role (case-insensitive)',
            schema: { type: 'string', example: 'manajemen grup' },
          },
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
            description: 'Daftar peran berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Data peran berhasil diambil',
                    },
                    data: {
                      type: 'array',
                      items: roleResponseSchema,
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
          '404': notFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
  },
};
