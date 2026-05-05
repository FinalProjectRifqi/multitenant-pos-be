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

const inventoryItemIdParam = {
  name: 'inventoryItemId',
  in: 'path',
  required: true,
  description: 'UUID item inventaris',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440010',
  },
};

const inventoryItemSchema = {
  type: 'object',
  properties: {
    inventory_item_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440010',
    },
    inventory_item_name: {
      type: 'string',
      example: 'Beras Premium 5kg',
    },
    description: {
      type: 'string',
      example: 'Bahan baku utama untuk menu nasi',
    },
    unit_of_measure: {
      type: 'string',
      example: 'kg',
    },
    current_stock: {
      type: 'integer',
      example: 75,
    },
    min_threshold: {
      type: 'integer',
      example: 20,
    },
    max_threshold: {
      type: 'integer',
      example: 150,
    },
    last_restocked_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-05-04T08:30:00.000Z',
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-05-01T08:30:00.000Z',
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-05-04T08:30:00.000Z',
    },
    deleted_at: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      example: null,
    },
    unit_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
  },
};

const inventoryStatsSchema = {
  type: 'object',
  properties: {
    total_inventory_item: { type: 'integer', example: 42 },
    inventory_item_low_stock: { type: 'integer', example: 7 },
    inventory_item_normal_stock: { type: 'integer', example: 35 },
    inventory_item_out_of_stock: { type: 'integer', example: 3 },
  },
};

const inventoryTransactionSchema = {
  type: 'object',
  properties: {
    inventory_transaction_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440111',
    },
    user_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440222',
    },
    inventory_item_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440010',
    },
    inventory_item_name: {
      type: 'string',
      example: 'Beras Premium 5kg',
    },
    transaction_type: {
      type: 'string',
      enum: ['in', 'out', 'adjustment'],
      example: 'out',
    },
    quantity_changed: {
      type: 'integer',
      example: 5,
    },
    quantity_before: {
      type: 'integer',
      example: 75,
    },
    quantity_after: {
      type: 'integer',
      example: 70,
    },
    notes: {
      type: 'string',
      nullable: true,
      example: 'Dipakai untuk operasional harian',
    },
    transacted_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-05-04T09:00:00.000Z',
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-05-04T09:00:00.000Z',
    },
    updated_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-05-04T09:00:00.000Z',
    },
  },
};

const paginationMetaSchema = {
  type: 'object',
  properties: {
    page: { type: 'integer', example: 1 },
    limit: { type: 'integer', example: 10 },
    total: { type: 'integer', example: 42 },
    totalPages: { type: 'integer', example: 5 },
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

const inventoryUnitNotFoundResponse = {
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
              code: {
                type: 'string',
                example: 'INVENTORY_UNIT_NOT_FOUND',
              },
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

const inventoryItemNotFoundResponse = {
  description: 'Item inventaris tidak ditemukan',
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
                example: 'INVENTORY_ITEM_NOT_FOUND',
                enum: ['INVENTORY_UNIT_NOT_FOUND', 'INVENTORY_ITEM_NOT_FOUND'],
              },
              message: {
                type: 'string',
                example: 'Item inventaris tidak ditemukan',
              },
            },
          },
        },
      },
    },
  },
};

const inventoryConflictResponse = {
  description: 'Nama item inventaris sudah digunakan di unit usaha ini',
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
                example: 'INVENTORY_ITEM_CONFLICT',
              },
              message: {
                type: 'string',
                example:
                  'Nama item inventaris sudah digunakan di unit usaha ini',
              },
            },
          },
        },
      },
    },
  },
};

const inventoryInsufficientStockResponse = {
  description: 'Stok inventaris tidak mencukupi untuk transaksi keluar',
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
                example: 'INVENTORY_INSUFFICIENT_STOCK',
                enum: ['VALIDATION_FAILED', 'INVENTORY_INSUFFICIENT_STOCK'],
              },
              message: {
                type: 'string',
                example:
                  'Stok inventaris tidak mencukupi untuk transaksi keluar',
              },
              details: {
                type: 'object',
                nullable: true,
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

const createInventoryItemFormFields = {
  inventory_item_name: {
    type: 'string',
    maxLength: 255,
    example: 'Beras Premium 5kg',
    description: 'Nama item inventaris',
  },
  description: {
    type: 'string',
    example: 'Bahan baku utama untuk menu nasi',
    description: 'Deskripsi item inventaris',
  },
  unit_of_measure: {
    type: 'string',
    maxLength: 50,
    example: 'kg',
    description: 'Satuan item inventaris',
  },
  current_stock: {
    type: 'integer',
    minimum: 0,
    example: 75,
    description: 'Stok saat ini (tidak boleh negatif)',
  },
  min_threshold: {
    type: 'integer',
    minimum: 0,
    example: 20,
    description: 'Batas minimum stok',
  },
  max_threshold: {
    type: 'integer',
    minimum: 1,
    example: 150,
    description: 'Batas maksimum stok (minimal 1)',
  },
};

const updateInventoryItemFormFields = {
  inventory_item_name: createInventoryItemFormFields.inventory_item_name,
  description: createInventoryItemFormFields.description,
  unit_of_measure: createInventoryItemFormFields.unit_of_measure,
  current_stock: createInventoryItemFormFields.current_stock,
  min_threshold: createInventoryItemFormFields.min_threshold,
  max_threshold: createInventoryItemFormFields.max_threshold,
};

const createInventoryTransactionFields = {
  inventory_item_id: {
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440010',
    description: 'UUID item inventaris yang ditransaksikan',
  },
  transaction_type: {
    type: 'string',
    enum: ['in', 'out', 'adjustment'],
    example: 'out',
    description: 'Tipe transaksi inventaris',
  },
  quantity_changed: {
    type: 'integer',
    minimum: 1,
    example: 5,
    description: 'Jumlah perubahan stok (minimal 1)',
  },
  notes: {
    type: 'string',
    nullable: true,
    example: 'Dipakai untuk operasional harian',
    description: 'Catatan transaksi (opsional)',
  },
};

export const inventarisSwaggerDoc = {
  tags: [
    {
      name: 'Inventaris',
      description:
        'Manajemen inventaris - CRUD item, statistik stok, dan transaksi inventaris per unit usaha',
    },
  ],
  paths: {
    '/v1/inventaris/{businessId}/items': {
      get: {
        tags: ['Inventaris'],
        summary: 'Ambil daftar item inventaris',
        description:
          'Mengambil daftar item inventaris pada unit usaha tertentu dengan dukungan pencarian, pengurutan, dan pagination. Membutuhkan permission `inventory:read`.',
        security: bearerSecurity,
        parameters: [
          businessIdParam,
          {
            name: 'search',
            in: 'query',
            required: false,
            description:
              'Kata kunci pencarian pada nama item inventaris (case-insensitive)',
            schema: { type: 'string', example: 'beras' },
          },
          {
            name: 'sortBy',
            in: 'query',
            required: false,
            description: 'Kolom untuk pengurutan',
            schema: {
              type: 'string',
              enum: [
                'inventory_item_name',
                'current_stock',
                'min_threshold',
                'max_threshold',
                'updated_at',
              ],
              default: 'updated_at',
              example: 'updated_at',
            },
          },
          {
            name: 'sortType',
            in: 'query',
            required: false,
            description: 'Arah pengurutan (default: DESC)',
            schema: {
              type: 'string',
              enum: ['ASC', 'DESC'],
              default: 'DESC',
              example: 'DESC',
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
            description: 'Daftar inventaris berhasil dimuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Daftar inventaris berhasil dimuat',
                    },
                    data: { type: 'array', items: inventoryItemSchema },
                    meta: paginationMetaSchema,
                  },
                },
              },
            },
          },
          '400': validationErrorResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': inventoryUnitNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
      post: {
        tags: ['Inventaris'],
        summary: 'Tambah item inventaris baru',
        description:
          'Menambahkan item inventaris baru ke unit usaha tertentu. Nama item harus unik dalam unit usaha yang sama. Field `last_restocked_at` dikelola otomatis oleh server. Membutuhkan permission `inventory:read` dan `inventory:create`.',
        security: bearerSecurity,
        parameters: [businessIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'inventory_item_name',
                  'description',
                  'unit_of_measure',
                  'current_stock',
                  'min_threshold',
                  'max_threshold',
                ],
                properties: createInventoryItemFormFields,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Item inventaris berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 201 },
                    message: {
                      type: 'string',
                      example: 'Item inventaris berhasil dibuat',
                    },
                    data: inventoryItemSchema,
                  },
                },
              },
            },
          },
          '400': validationErrorResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': inventoryUnitNotFoundResponse,
          '409': inventoryConflictResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/inventaris/{businessId}/stats': {
      get: {
        tags: ['Inventaris'],
        summary: 'Ambil statistik inventaris',
        description:
          'Mengambil statistik total item, item dengan stok rendah, dan item dengan stok normal pada unit usaha tertentu. Membutuhkan permission `inventory:read`.',
        security: bearerSecurity,
        parameters: [businessIdParam],
        responses: {
          '200': {
            description: 'Statistik inventaris berhasil dimuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Statistik inventaris berhasil dimuat',
                    },
                    data: inventoryStatsSchema,
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': inventoryUnitNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/inventaris/{businessId}/items/{inventoryItemId}': {
      get: {
        tags: ['Inventaris'],
        summary: 'Ambil detail item inventaris',
        description:
          'Mengambil detail satu item inventaris berdasarkan ID pada unit usaha tertentu. Membutuhkan permission `inventory:read`.',
        security: bearerSecurity,
        parameters: [businessIdParam, inventoryItemIdParam],
        responses: {
          '200': {
            description: 'Detail inventaris berhasil dimuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Detail inventaris berhasil dimuat',
                    },
                    data: inventoryItemSchema,
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': inventoryItemNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
      patch: {
        tags: ['Inventaris'],
        summary: 'Perbarui item inventaris (partial)',
        description:
          'Memperbarui data item inventaris secara parsial. Minimal satu field harus dikirim. Jika field `current_stock` diubah, sistem akan otomatis mencatat transaksi inventaris bertipe `in` atau `out` berdasarkan selisih stok, serta memperbarui `last_restocked_at`. Membutuhkan permission `inventory:read` dan `inventory:update`.',
        security: bearerSecurity,
        parameters: [businessIdParam, inventoryItemIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: updateInventoryItemFormFields,
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Item inventaris berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Item inventaris berhasil diperbarui',
                    },
                    data: inventoryItemSchema,
                  },
                },
              },
            },
          },
          '400': validationErrorResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': inventoryItemNotFoundResponse,
          '409': inventoryConflictResponse,
          '500': internalServerErrorResponse,
        },
      },
      delete: {
        tags: ['Inventaris'],
        summary: 'Hapus item inventaris',
        description:
          'Menghapus item inventaris secara soft-delete pada unit usaha tertentu. Membutuhkan permission `inventory:read` dan `inventory:delete`.',
        security: bearerSecurity,
        parameters: [businessIdParam, inventoryItemIdParam],
        responses: {
          '200': {
            description: 'Item inventaris berhasil dihapus',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Item inventaris berhasil dihapus',
                    },
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': inventoryItemNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/inventaris/{businessId}/transactions': {
      get: {
        tags: ['Inventaris'],
        summary: 'Ambil riwayat transaksi inventaris',
        description:
          'Mengambil riwayat transaksi inventaris pada unit usaha tertentu dengan dukungan filter item, filter tipe transaksi, dan pagination. Membutuhkan permission `inventory:read`.',
        security: bearerSecurity,
        parameters: [
          businessIdParam,
          {
            name: 'inventory_item_id',
            in: 'query',
            required: false,
            description: 'UUID item inventaris untuk filter transaksi',
            schema: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440010',
            },
          },
          {
            name: 'transaction_type',
            in: 'query',
            required: false,
            description: 'Tipe transaksi inventaris',
            schema: {
              type: 'string',
              enum: ['in', 'out', 'adjustment'],
              example: 'out',
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
            description: 'Riwayat transaksi inventaris berhasil dimuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Riwayat transaksi inventaris berhasil dimuat',
                    },
                    data: { type: 'array', items: inventoryTransactionSchema },
                    meta: paginationMetaSchema,
                  },
                },
              },
            },
          },
          '400': validationErrorResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': inventoryUnitNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
      post: {
        tags: ['Inventaris'],
        summary: 'Buat transaksi inventaris',
        description:
          'Mencatat transaksi inventaris (masuk, keluar, atau adjustment) dan memperbarui stok item secara atomik. Membutuhkan permission `inventory:read` dan `inventory:create`.',
        security: bearerSecurity,
        parameters: [businessIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'inventory_item_id',
                  'transaction_type',
                  'quantity_changed',
                ],
                properties: createInventoryTransactionFields,
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Transaksi inventaris berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 201 },
                    message: {
                      type: 'string',
                      example: 'Transaksi inventaris berhasil dibuat',
                    },
                    data: inventoryTransactionSchema,
                  },
                },
              },
            },
          },
          '400': inventoryInsufficientStockResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': inventoryItemNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
  },
};
