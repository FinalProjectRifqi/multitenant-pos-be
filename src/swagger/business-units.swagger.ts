const businessUnitResponseSchema = {
  type: 'object',
  properties: {
    business_unit_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    business_unit_name: { type: 'string', example: 'Toko Maju Jaya' },
    business_unit_address: {
      type: 'string',
      example: 'Jl. Sudirman No. 10, Jakarta',
    },
    business_unit_phone: {
      type: 'string',
      nullable: true,
      example: '081234567890',
    },
    business_unit_status: {
      type: 'string',
      example: 'active',
      enum: ['active', 'inactive'],
    },
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
  description: 'Unit usaha tidak ditemukan',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'UNIT_NOT_FOUND' },
              message: {
                type: 'string',
                example: 'Unit usaha tidak ditemukan',
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
              message: { type: 'string', example: 'Request validation failed' },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
  },
};

const conflictResponse = {
  description: 'Nama unit usaha sudah digunakan',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          code: { type: 'string', example: 'UNIT_CONFLICT' },
          message: {
            type: 'string',
            example: 'Nama unit usaha sudah digunakan',
          },
          details: {
            type: 'array',
            items: { type: 'object' },
            example: [
              {
                property: 'business_unit_name',
                constraints: {
                  unique: 'Nama unit usaha sudah digunakan',
                },
              },
            ],
          },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'UNIT_CONFLICT' },
              message: {
                type: 'string',
                example: 'Nama unit usaha sudah digunakan',
              },
              details: { type: 'array', items: { type: 'object' } },
            },
          },
        },
      },
    },
  },
};

const bearerSecurity = [{ bearerAuth: [] }];

export const businessUnitsSwaggerDoc = {
  tags: [
    {
      name: 'Business Units',
      description: 'Manajemen unit usaha — CRUD dan statistik',
    },
  ],
  paths: {
    '/v1/business-units': {
      get: {
        tags: ['Business Units'],
        summary: 'Ambil daftar unit usaha',
        description:
          'Mengambil daftar unit usaha dengan dukungan pencarian, filter status, dan pagination. Membutuhkan permission `unit:read`.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'search',
            in: 'query',
            required: false,
            description:
              'Kata kunci pencarian pada nama, alamat, atau nomor telepon unit usaha (case-insensitive)',
            schema: { type: 'string', example: 'toko maju' },
          },
          {
            name: 'show_inactive',
            in: 'query',
            required: false,
            description:
              'Tampilkan unit usaha tidak aktif. Jika tidak dikirim atau "false", hanya tampilkan yang aktif.',
            schema: {
              type: 'string',
              enum: ['true', 'false'],
              example: 'false',
            },
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
            description: 'Daftar unit usaha berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Data unit usaha berhasil diambil',
                    },
                    data: {
                      type: 'array',
                      items: businessUnitResponseSchema,
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
          '400': validationErrorResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '500': internalServerErrorResponse,
        },
      },
      post: {
        tags: ['Business Units'],
        summary: 'Buat unit usaha baru',
        description:
          'Membuat unit usaha baru. Membutuhkan permission `unit:read` dan `unit:create`. Nomor telepon harus berformat Indonesia jika disertakan.',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['business_unit_name', 'business_unit_address'],
                properties: {
                  business_unit_name: {
                    type: 'string',
                    maxLength: 255,
                    example: 'Toko Maju Jaya',
                    description:
                      'Nama unit usaha (wajib, maksimal 255 karakter)',
                  },
                  business_unit_address: {
                    type: 'string',
                    example: 'Jl. Sudirman No. 10, Jakarta',
                    description: 'Alamat unit usaha (wajib)',
                  },
                  business_unit_phone: {
                    type: 'string',
                    example: '081234567890',
                    description:
                      'Nomor telepon unit usaha (opsional). Format: 08xx, +628xx, atau 628xx',
                  },
                  is_active: {
                    type: 'boolean',
                    example: true,
                    description:
                      'Status aktif unit usaha (opsional, default: true)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Unit usaha berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 201 },
                    message: {
                      type: 'string',
                      example: 'Unit usaha berhasil dibuat',
                    },
                    data: businessUnitResponseSchema,
                  },
                },
              },
            },
          },
          '400': validationErrorResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '409': conflictResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/business-units/stats': {
      get: {
        tags: ['Business Units'],
        summary: 'Ambil statistik unit usaha',
        description:
          'Mengambil statistik total, aktif, dan tidak aktif unit usaha. Membutuhkan permission `unit:read`.',
        security: bearerSecurity,
        responses: {
          '200': {
            description: 'Statistik unit usaha berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Statistik unit usaha berhasil diambil',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        total_business_unit: { type: 'integer', example: 25 },
                        business_unit_active: { type: 'integer', example: 20 },
                        business_unit_inactive: { type: 'integer', example: 5 },
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
    '/v1/business-units/{id}': {
      get: {
        tags: ['Business Units'],
        summary: 'Ambil detail unit usaha',
        description:
          'Mengambil detail satu unit usaha berdasarkan ID. Membutuhkan permission `unit:read`.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID unit usaha',
            schema: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Detail unit usaha berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Detail unit usaha berhasil diambil',
                    },
                    data: businessUnitResponseSchema,
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
      patch: {
        tags: ['Business Units'],
        summary: 'Perbarui unit usaha (partial)',
        description:
          'Memperbarui data unit usaha secara parsial. Hanya field yang dikirim yang akan diubah. Membutuhkan permission `unit:read` dan `unit:update`.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID unit usaha',
            schema: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  business_unit_name: {
                    type: 'string',
                    maxLength: 255,
                    example: 'Toko Maju Jaya Baru',
                    description: 'Nama baru unit usaha (opsional)',
                  },
                  business_unit_address: {
                    type: 'string',
                    example: 'Jl. Gatot Subroto No. 5, Jakarta',
                    description: 'Alamat baru unit usaha (opsional)',
                  },
                  business_unit_phone: {
                    type: 'string',
                    example: '082345678901',
                    description:
                      'Nomor telepon baru (opsional). Format: 08xx, +628xx, atau 628xx',
                  },
                  is_active: {
                    type: 'boolean',
                    example: false,
                    description: 'Status aktif baru (opsional)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Unit usaha berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Unit usaha berhasil diperbarui',
                    },
                    data: businessUnitResponseSchema,
                  },
                },
              },
            },
          },
          '400': validationErrorResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': notFoundResponse,
          '409': conflictResponse,
          '500': internalServerErrorResponse,
        },
      },
      delete: {
        tags: ['Business Units'],
        summary: 'Hapus unit usaha',
        description:
          'Menghapus unit usaha secara soft-delete (data tetap ada di database). Membutuhkan permission `unit:read` dan `unit:delete`.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID unit usaha',
            schema: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Unit usaha berhasil dihapus',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Unit usaha berhasil dihapus',
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
