const businessUnitRefSchema = {
  type: 'object',
  properties: {
    business_unit_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    business_unit_name: { type: 'string', example: 'Toko Maju Jaya' },
  },
};

const userResponseSchema = {
  type: 'object',
  properties: {
    user_id: {
      type: 'string',
      format: 'uuid',
      example: 'a3bb4c2e-f123-4d56-b789-000000000001',
    },
    full_name: { type: 'string', example: 'Budi Santoso' },
    user_name: { type: 'string', example: 'budi.santoso' },
    email: { type: 'string', format: 'email', example: 'budi@example.com' },
    role_id: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      example: 'a3bb4c2e-f123-4d56-b789-000000000002',
    },
    role_name: { type: 'string', nullable: true, example: 'Kasir' },
    status: {
      type: 'string',
      enum: ['active', 'inactive'],
      example: 'active',
    },
    last_login: {
      type: 'string',
      format: 'date-time',
      example: '2025-01-15T08:00:00.000Z',
    },
    business_units: {
      type: 'array',
      items: businessUnitRefSchema,
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
  description: 'Pengguna tidak ditemukan',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'USER_NOT_FOUND' },
              message: {
                type: 'string',
                example: 'Pengguna tidak ditemukan',
              },
            },
          },
        },
      },
    },
  },
};

const conflictResponse = {
  description: 'Username atau email sudah digunakan',
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
                example: 'USER_USERNAME_CONFLICT',
                enum: ['USER_USERNAME_CONFLICT', 'USER_EMAIL_CONFLICT'],
              },
              message: {
                type: 'string',
                example: 'Username sudah digunakan',
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

export const usersSwaggerDoc = {
  tags: [
    {
      name: 'Users',
      description: 'Manajemen pengguna — CRUD dan statistik',
    },
  ],
  paths: {
    '/v1/users': {
      get: {
        tags: ['Users'],
        summary: 'Ambil daftar pengguna',
        description:
          'Mengambil daftar pengguna dengan dukungan pencarian, pengurutan, dan pagination. Membutuhkan permission `user:read`.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'search',
            in: 'query',
            required: false,
            description:
              'Kata kunci pencarian pada nama, username, email, atau role (case-insensitive)',
            schema: { type: 'string', example: 'budi' },
          },
          {
            name: 'business_unit_id',
            in: 'query',
            required: false,
            description: 'Filter pengguna berdasarkan UUID unit usaha',
            schema: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440000',
            },
          },
          {
            name: 'role_id',
            in: 'query',
            required: false,
            description: 'Filter pengguna berdasarkan UUID role',
            schema: {
              type: 'string',
              format: 'uuid',
              example: 'a3bb4c2e-f123-4d56-b789-000000000002',
            },
          },
          {
            name: 'sortBy',
            in: 'query',
            required: false,
            description: 'Kolom untuk pengurutan',
            schema: {
              type: 'string',
              enum: [
                'full_name',
                'username',
                'business_unit_name',
                'role_name',
                'status',
                'last_login',
              ],
              example: 'full_name',
            },
          },
          {
            name: 'sortType',
            in: 'query',
            required: false,
            description: 'Arah pengurutan (default: ASC)',
            schema: {
              type: 'string',
              enum: ['ASC', 'DESC'],
              default: 'ASC',
              example: 'ASC',
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
            description: 'Daftar pengguna berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Data pengguna berhasil diambil',
                    },
                    data: {
                      type: 'array',
                      items: userResponseSchema,
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
        tags: ['Users'],
        summary: 'Buat pengguna baru',
        description:
          'Membuat pengguna baru dan langsung meng-assign ke unit usaha. Membutuhkan permission `user:read`, `user:create`, dan `unit:assign_user`. Password akan dikembalikan dalam respons (plain text) untuk keperluan internal.',
        security: bearerSecurity,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'full_name',
                  'user_name',
                  'email',
                  'role_id',
                  'business_unit_id',
                  'password',
                ],
                properties: {
                  full_name: {
                    type: 'string',
                    maxLength: 255,
                    example: 'Budi Santoso',
                    description: 'Nama lengkap pengguna (wajib)',
                  },
                  user_name: {
                    type: 'string',
                    maxLength: 255,
                    example: 'budi.santoso',
                    description: 'Username pengguna (wajib, harus unik)',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    maxLength: 255,
                    example: 'budi@example.com',
                    description: 'Alamat email pengguna (wajib, harus unik)',
                  },
                  role_id: {
                    type: 'string',
                    format: 'uuid',
                    example: 'a3bb4c2e-f123-4d56-b789-000000000002',
                    description: 'UUID role pengguna (wajib)',
                  },
                  business_unit_id: {
                    type: 'string',
                    format: 'uuid',
                    example: '550e8400-e29b-41d4-a716-446655440000',
                    description: 'UUID unit usaha yang di-assign (wajib)',
                  },
                  password: {
                    type: 'string',
                    minLength: 8,
                    maxLength: 255,
                    example: 'password123',
                    description:
                      'Password pengguna (wajib, minimal 8 karakter)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Pengguna berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 201 },
                    message: {
                      type: 'string',
                      example: 'Pengguna berhasil dibuat',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        user_id: {
                          type: 'string',
                          format: 'uuid',
                          example: 'a3bb4c2e-f123-4d56-b789-000000000001',
                        },
                        user_name: { type: 'string', example: 'budi.santoso' },
                        password: {
                          type: 'string',
                          example: 'password123',
                          description: 'Password yang diinput (plain text)',
                        },
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
          '404': {
            description: 'Role atau unit usaha tidak ditemukan',
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
                          example: 'ROLE_NOT_FOUND',
                          enum: ['ROLE_NOT_FOUND', 'UNIT_NOT_FOUND'],
                        },
                        message: {
                          type: 'string',
                          example: 'Role tidak ditemukan',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '409': conflictResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/users/stats': {
      get: {
        tags: ['Users'],
        summary: 'Ambil statistik pengguna',
        description:
          'Mengambil statistik total, aktif, dan tidak aktif pengguna (termasuk yang sudah dihapus). Membutuhkan permission `user:read`.',
        security: bearerSecurity,
        responses: {
          '200': {
            description: 'Statistik pengguna berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Statistik pengguna berhasil diambil',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        total_users: { type: 'integer', example: 30 },
                        users_active: { type: 'integer', example: 25 },
                        users_inactive: { type: 'integer', example: 5 },
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
    '/v1/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Ambil detail pengguna',
        description:
          'Mengambil detail satu pengguna berdasarkan ID. Membutuhkan permission `user:read`.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID pengguna',
            schema: {
              type: 'string',
              format: 'uuid',
              example: 'a3bb4c2e-f123-4d56-b789-000000000001',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Detail pengguna berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Detail pengguna berhasil diambil',
                    },
                    data: userResponseSchema,
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
        tags: ['Users'],
        summary: 'Perbarui pengguna (partial)',
        description:
          'Memperbarui data pengguna secara parsial. Hanya field yang dikirim yang akan diubah. Membutuhkan permission `user:read`, `user:update`, dan `unit:assign_user`. Tidak dapat menonaktifkan akun sendiri.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID pengguna',
            schema: {
              type: 'string',
              format: 'uuid',
              example: 'a3bb4c2e-f123-4d56-b789-000000000001',
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
                  full_name: {
                    type: 'string',
                    maxLength: 255,
                    example: 'Budi Santoso Baru',
                    description: 'Nama lengkap baru (opsional)',
                  },
                  user_name: {
                    type: 'string',
                    maxLength: 255,
                    example: 'budi.baru',
                    description: 'Username baru (opsional)',
                  },
                  email: {
                    type: 'string',
                    format: 'email',
                    maxLength: 255,
                    example: 'budi.baru@example.com',
                    description: 'Email baru (opsional)',
                  },
                  role_id: {
                    type: 'string',
                    format: 'uuid',
                    example: 'a3bb4c2e-f123-4d56-b789-000000000003',
                    description: 'UUID role baru (opsional)',
                  },
                  business_unit_id: {
                    type: 'string',
                    format: 'uuid',
                    example: '550e8400-e29b-41d4-a716-446655440001',
                    description: 'UUID unit usaha baru (opsional)',
                  },
                  status: {
                    type: 'string',
                    enum: ['active', 'inactive'],
                    example: 'inactive',
                    description: 'Status baru pengguna (opsional)',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Pengguna berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Pengguna berhasil diperbarui',
                    },
                    data: userResponseSchema,
                  },
                },
              },
            },
          },
          '400': {
            description:
              'Validasi gagal, body kosong, atau mencoba menonaktifkan akun sendiri',
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
                          example: 'USER_SELF_DEACTIVATE',
                          enum: ['VALIDATION_FAILED', 'USER_SELF_DEACTIVATE'],
                        },
                        message: {
                          type: 'string',
                          example:
                            'Anda tidak dapat menonaktifkan akun Anda sendiri',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': {
            description: 'Pengguna, role, atau unit usaha tidak ditemukan',
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
                          example: 'USER_NOT_FOUND',
                          enum: [
                            'USER_NOT_FOUND',
                            'ROLE_NOT_FOUND',
                            'UNIT_NOT_FOUND',
                          ],
                        },
                        message: {
                          type: 'string',
                          example: 'Pengguna tidak ditemukan',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '409': conflictResponse,
          '500': internalServerErrorResponse,
        },
      },
      delete: {
        tags: ['Users'],
        summary: 'Hapus pengguna',
        description:
          'Menghapus pengguna secara soft-delete (data tetap ada di database). Assignment ke unit usaha juga ikut di-soft-delete. Tidak dapat menghapus akun sendiri. Membutuhkan permission `user:read` dan `user:delete`.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            description: 'UUID pengguna',
            schema: {
              type: 'string',
              format: 'uuid',
              example: 'a3bb4c2e-f123-4d56-b789-000000000001',
            },
          },
        ],
        responses: {
          '200': {
            description: 'Pengguna berhasil dihapus',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Pengguna berhasil dihapus',
                    },
                  },
                },
              },
            },
          },
          '400': {
            description: 'Mencoba menghapus akun sendiri',
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
                          example: 'USER_SELF_DELETE',
                        },
                        message: {
                          type: 'string',
                          example:
                            'Anda tidak dapat menghapus akun Anda sendiri',
                        },
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
