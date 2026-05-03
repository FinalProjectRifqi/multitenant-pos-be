const bearerSecurity = [{ bearerAuth: [] }];

const businessIdParam = {
  name: 'businessId',
  in: 'path',
  required: true,
  description: 'UUID unit usaha',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  },
};

const menuIdParam = {
  name: 'menuId',
  in: 'path',
  required: true,
  description: 'UUID menu item',
  schema: {
    type: 'string',
    format: 'uuid',
    example: 'a3bb4c2e-f123-4d56-b789-000000000010',
  },
};

const menuResponseSchema = {
  type: 'object',
  properties: {
    menu_id: {
      type: 'string',
      format: 'uuid',
      example: 'a3bb4c2e-f123-4d56-b789-000000000010',
    },
    menu_name: { type: 'string', example: 'Nasi Goreng Spesial' },
    menu_category_id: {
      type: 'string',
      format: 'uuid',
      example: 'a3bb4c2e-f123-4d56-b789-000000000020',
    },
    menu_category_name: {
      type: 'string',
      nullable: true,
      example: 'Makanan Berat',
    },
    menu_price: { type: 'integer', example: 25000 },
    menu_image: {
      type: 'string',
      nullable: true,
      example:
        'https://storage.example.com/menus/uuid/image.jpg?token=xxx',
    },
    business_unit_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    business_unit_name: {
      type: 'string',
      nullable: true,
      example: 'Toko Maju Jaya',
    },
    is_available: { type: 'boolean', example: true },
  },
};

const menuMutationResponseSchema = {
  type: 'object',
  properties: {
    menu_id: {
      type: 'string',
      format: 'uuid',
      example: 'a3bb4c2e-f123-4d56-b789-000000000010',
    },
    menu_name: { type: 'string', example: 'Nasi Goreng Spesial' },
    menu_category_id: {
      type: 'string',
      format: 'uuid',
      example: 'a3bb4c2e-f123-4d56-b789-000000000020',
    },
    menu_category_name: {
      type: 'string',
      nullable: true,
      example: 'Makanan Berat',
    },
    menu_price: { type: 'integer', example: 25000 },
    menu_image: {
      type: 'string',
      nullable: true,
      example:
        'https://storage.example.com/menus/uuid/image.jpg?token=xxx',
    },
    is_available: { type: 'boolean', example: true },
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

const unitNotFoundResponse = {
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

const menuNotFoundResponse = {
  description: 'Menu tidak ditemukan',
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
                example: 'MENU_NOT_FOUND',
                enum: ['UNIT_NOT_FOUND', 'MENU_NOT_FOUND'],
              },
              message: {
                type: 'string',
                example: 'Menu tidak ditemukan',
              },
            },
          },
        },
      },
    },
  },
};

const menuConflictResponse = {
  description: 'Nama menu sudah digunakan di unit usaha ini',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'MENU_CONFLICT' },
              message: {
                type: 'string',
                example: 'Nama menu sudah digunakan di unit usaha ini',
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

const menuFormFields = {
  menu_name: {
    type: 'string',
    maxLength: 255,
    example: 'Nasi Goreng Spesial',
    description: 'Nama menu',
  },
  menu_category_id: {
    type: 'string',
    format: 'uuid',
    example: 'a3bb4c2e-f123-4d56-b789-000000000020',
    description: 'UUID kategori menu (harus milik unit usaha ini)',
  },
  item_price: {
    type: 'number',
    minimum: 0,
    example: 25000,
    description: 'Harga menu (tidak boleh negatif)',
  },
  is_available: {
    type: 'boolean',
    example: true,
    description: 'Status ketersediaan menu (true/false)',
  },
  menu_image: {
    type: 'string',
    format: 'binary',
    description:
      'File gambar menu (opsional). Hanya file image/* yang diizinkan dan tidak boleh melebihi batas ukuran yang dikonfigurasi.',
  },
};

export const menusSwaggerDoc = {
  tags: [
    {
      name: 'Menus',
      description: 'Manajemen menu — CRUD dan statistik menu per unit usaha',
    },
  ],
  paths: {
    '/v1/menus/{businessId}': {
      get: {
        tags: ['Menus'],
        summary: 'Ambil daftar menu',
        description:
          'Mengambil daftar menu di unit usaha tertentu dengan dukungan pencarian, pengurutan, dan pagination. Menampilkan semua menu termasuk yang tidak tersedia. Membutuhkan permission `menu:read` dan `menu_category:read`.',
        security: bearerSecurity,
        parameters: [
          businessIdParam,
          {
            name: 'search',
            in: 'query',
            required: false,
            description: 'Kata kunci pencarian pada nama menu atau nama kategori (case-insensitive)',
            schema: { type: 'string', example: 'nasi' },
          },
          {
            name: 'sortBy',
            in: 'query',
            required: false,
            description: 'Kolom untuk pengurutan',
            schema: {
              type: 'string',
              enum: ['menu_name', 'menu_category', 'menu_price'],
              default: 'menu_name',
              example: 'menu_name',
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
            description: 'Jumlah data per halaman (default: 10, minimal: 1, maksimal: 100)',
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
            description: 'Daftar menu berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Data menu berhasil diambil',
                    },
                    data: { type: 'array', items: menuResponseSchema },
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
          '404': unitNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
      post: {
        tags: ['Menus'],
        summary: 'Tambah menu baru',
        description:
          'Menambahkan menu baru ke unit usaha tertentu. Upload gambar bersifat opsional. Nama menu harus unik di dalam unit usaha yang sama. Membutuhkan permission `menu:read` dan `menu:create`.',
        security: bearerSecurity,
        parameters: [businessIdParam],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['menu_name', 'menu_category_id', 'item_price', 'is_available'],
                properties: menuFormFields,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Menu berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 201 },
                    message: { type: 'string', example: 'Menu berhasil dibuat' },
                    data: menuMutationResponseSchema,
                  },
                },
              },
            },
          },
          '400': {
            description:
              'Validasi gagal, tipe file tidak valid, atau ukuran file melebihi batas',
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
                          example: 'MENU_INVALID_IMAGE_TYPE',
                          enum: [
                            'VALIDATION_FAILED',
                            'MENU_INVALID_IMAGE_TYPE',
                          ],
                        },
                        message: {
                          type: 'string',
                          example:
                            'Tipe file gambar tidak valid. Hanya file gambar yang diizinkan (image/*)',
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
            description: 'Unit usaha atau kategori menu tidak ditemukan',
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
                          example: 'MENU_CATEGORY_NOT_FOUND',
                          enum: ['UNIT_NOT_FOUND', 'MENU_CATEGORY_NOT_FOUND'],
                        },
                        message: {
                          type: 'string',
                          example:
                            'Kategori menu tidak ditemukan atau tidak milik unit usaha ini',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '409': menuConflictResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/menus/{businessId}/stats': {
      get: {
        tags: ['Menus'],
        summary: 'Ambil statistik menu',
        description:
          'Mengambil statistik total, aktif, dan tidak aktif menu di unit usaha tertentu (tidak termasuk menu yang sudah dihapus). Membutuhkan permission `menu:read` dan `menu_category:read`.',
        security: bearerSecurity,
        parameters: [businessIdParam],
        responses: {
          '200': {
            description: 'Statistik menu berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Statistik menu berhasil diambil',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        total_menu: { type: 'integer', example: 20 },
                        menu_active: { type: 'integer', example: 15 },
                        menu_inactive: { type: 'integer', example: 5 },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': unitNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/menus/{businessId}/{menuId}': {
      get: {
        tags: ['Menus'],
        summary: 'Ambil detail menu',
        description:
          'Mengambil detail satu menu berdasarkan ID. Menu harus milik unit usaha yang ditentukan. Membutuhkan permission `menu:read`.',
        security: bearerSecurity,
        parameters: [businessIdParam, menuIdParam],
        responses: {
          '200': {
            description: 'Detail menu berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Detail menu berhasil diambil',
                    },
                    data: menuResponseSchema,
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': menuNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
      patch: {
        tags: ['Menus'],
        summary: 'Perbarui menu (partial)',
        description:
          'Memperbarui data menu secara parsial. Minimal satu field harus dikirim. Jika gambar baru dikirim, gambar lama akan diganti. Membutuhkan permission `menu:read` dan `menu:update`.',
        security: bearerSecurity,
        parameters: [businessIdParam, menuIdParam],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                properties: menuFormFields,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Menu berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Menu berhasil diperbarui',
                    },
                    data: menuMutationResponseSchema,
                  },
                },
              },
            },
          },
          '400': {
            description:
              'Validasi gagal, body kosong, tipe file tidak valid, atau ukuran file melebihi batas',
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
                          example: 'VALIDATION_FAILED',
                          enum: [
                            'VALIDATION_FAILED',
                            'MENU_INVALID_IMAGE_TYPE',
                          ],
                        },
                        message: {
                          type: 'string',
                          example:
                            'Minimal satu field harus diisi untuk melakukan pembaruan',
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
            description: 'Unit usaha, menu, atau kategori menu tidak ditemukan',
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
                          example: 'MENU_NOT_FOUND',
                          enum: [
                            'UNIT_NOT_FOUND',
                            'MENU_NOT_FOUND',
                            'MENU_CATEGORY_NOT_FOUND',
                          ],
                        },
                        message: {
                          type: 'string',
                          example: 'Menu tidak ditemukan',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '409': menuConflictResponse,
          '500': internalServerErrorResponse,
        },
      },
      delete: {
        tags: ['Menus'],
        summary: 'Hapus menu',
        description:
          'Menghapus menu secara soft-delete. Gambar menu di storage juga akan dihapus jika ada. Jika penghapusan gambar gagal, operasi akan dibatalkan sepenuhnya. Membutuhkan permission `menu:read` dan `menu:delete`.',
        security: bearerSecurity,
        parameters: [businessIdParam, menuIdParam],
        responses: {
          '200': {
            description: 'Menu berhasil dihapus',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Menu berhasil dihapus',
                    },
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': menuNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
  },
};
