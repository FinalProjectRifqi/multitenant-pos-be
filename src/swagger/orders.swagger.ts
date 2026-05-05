const bearerSecurity = [{ bearerAuth: [] }];

const unitIdParam = {
  name: 'unitId',
  in: 'path',
  required: true,
  description: 'UUID unit usaha',
  schema: {
    type: 'string',
    format: 'uuid',
    example: '550e8400-e29b-41d4-a716-446655440000',
  },
};

const orderIdParam = {
  name: 'orderId',
  in: 'path',
  required: true,
  description: 'UUID order',
  schema: {
    type: 'string',
    format: 'uuid',
    example: 'a3bb4c2e-f123-4d56-b789-000000000010',
  },
};

const paymentIdParam = {
  name: 'paymentId',
  in: 'path',
  required: true,
  description: 'UUID payment',
  schema: {
    type: 'string',
    format: 'uuid',
    example: 'f1cc5d3f-g234-5e67-c890-999999999999',
  },
};

// ===========================
// Reusable Schemas
// ===========================

const orderItemSchema = {
  type: 'object',
  properties: {
    order_item_id: {
      type: 'string',
      format: 'uuid',
      example: 'b1cc5d3f-g234-5e67-c890-111111111111',
    },
    menu_item_id: {
      type: 'string',
      format: 'uuid',
      example: 'c2dd6e4g-h345-6f78-d901-222222222222',
    },
    menu_item_name: { type: 'string', example: 'Nasi Goreng Spesial' },
    quantity: { type: 'integer', example: 2 },
    item_price: { type: 'number', example: 25000 },
    subtotal: { type: 'number', example: 50000 },
    notes: { type: 'string', nullable: true, example: 'Tidak pedas' },
  },
};

const orderListItemSchema = {
  type: 'object',
  properties: {
    order_id: {
      type: 'string',
      format: 'uuid',
      example: 'a3bb4c2e-f123-4d56-b789-000000000010',
    },
    order_number: { type: 'string', example: 'ORD-20250115-0001' },
    customer_name: { type: 'string', example: 'Budi Santoso' },
    table_number: { type: 'string', nullable: true, example: '5' },
    order_type_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440001',
    },
    order_type_name: { type: 'string', example: 'Dine-in' },
    total_amount: { type: 'number', example: 55000 },
    order_status_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440002',
    },
    order_status_name: { type: 'string', example: 'menunggu' },
    ordered_at: {
      type: 'string',
      format: 'date-time',
      example: '2025-01-15T10:30:00.000Z',
    },
  },
};

const orderDetailSchema = {
  type: 'object',
  properties: {
    order_id: {
      type: 'string',
      format: 'uuid',
      example: 'a3bb4c2e-f123-4d56-b789-000000000010',
    },
    unit_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440000',
    },
    user_id: {
      type: 'string',
      format: 'uuid',
      example: '660f9511-f3ac-52e5-b827-557766551111',
    },
    order_number: { type: 'string', example: 'ORD-20250115-0001' },
    customer_name: { type: 'string', example: 'Budi Santoso' },
    table_number: { type: 'string', nullable: true, example: '5' },
    notes: {
      type: 'string',
      nullable: true,
      example: 'Tolong siapkan cepat',
    },
    subtotal: { type: 'number', example: 50000 },
    tax_amount: { type: 'number', example: 5000 },
    total_amount: { type: 'number', example: 55000 },
    ordered_at: {
      type: 'string',
      format: 'date-time',
      example: '2025-01-15T10:30:00.000Z',
    },
    completed_at: {
      type: 'string',
      format: 'date-time',
      nullable: true,
      example: null,
    },
    order_type_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440001',
    },
    order_type_name: { type: 'string', example: 'Dine-in' },
    order_status_id: {
      type: 'string',
      format: 'uuid',
      example: '550e8400-e29b-41d4-a716-446655440002',
    },
    order_status_name: { type: 'string', example: 'menunggu' },
    items: {
      type: 'array',
      items: orderItemSchema,
    },
  },
};

const paymentResponseSchema = {
  type: 'object',
  properties: {
    payment_id: {
      type: 'string',
      format: 'uuid',
      example: 'f1cc5d3f-g234-5e67-c890-999999999999',
    },
    order_id: {
      type: 'string',
      format: 'uuid',
      example: 'a3bb4c2e-f123-4d56-b789-000000000010',
    },
    reference_number: {
      type: 'string',
      example: 'PAY-ORD-20250115-0001-20250115103045',
    },
    amount: { type: 'number', example: 55000 },
    payment_status: {
      type: 'string',
      enum: ['pending', 'paid', 'failed', 'expired', 'cancelled', 'refunded'],
      example: 'pending',
    },
    failure_reason: {
      type: 'string',
      nullable: true,
      example: null,
    },
    paid_at: {
      type: 'string',
      format: 'date-time',
      example: '2025-01-15T10:30:00.000Z',
    },
    expired_at: {
      type: 'string',
      format: 'date-time',
      example: '2025-01-15T10:45:00.000Z',
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      example: '2025-01-15T10:30:00.000Z',
    },
  },
};

const paymentCashlessResponseSchema = {
  type: 'object',
  properties: {
    payment: paymentResponseSchema,
    snap_token: { type: 'string', example: 'dummy-snap-token' },
    redirect_url: {
      type: 'string',
      example: 'https://app.sandbox.midtrans.com/snap/v2/vtweb/abc',
    },
  },
};

// ===========================
// Reusable Error Responses
// ===========================

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

const orderNotFoundResponse = {
  description: 'Unit usaha atau order tidak ditemukan',
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
                example: 'ORDER_NOT_FOUND',
                enum: ['UNIT_NOT_FOUND', 'ORDER_NOT_FOUND'],
              },
              message: {
                type: 'string',
                example: 'Order tidak ditemukan',
              },
            },
          },
        },
      },
    },
  },
};

const paymentNotFoundResponse = {
  description: 'Payment tidak ditemukan',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'PAYMENT_NOT_FOUND' },
              message: {
                type: 'string',
                example: 'Payment tidak ditemukan',
              },
            },
          },
        },
      },
    },
  },
};

const paymentDetailNotFoundResponse = {
  description: 'Unit usaha, order, atau payment tidak ditemukan',
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
                example: 'PAYMENT_NOT_FOUND',
                enum: [
                  'UNIT_NOT_FOUND',
                  'ORDER_NOT_FOUND',
                  'PAYMENT_NOT_FOUND',
                ],
              },
              message: {
                type: 'string',
                example: 'Payment tidak ditemukan',
              },
            },
          },
        },
      },
    },
  },
};

const paymentAlreadyActiveResponse = {
  description: 'Payment aktif sudah ada untuk order ini',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'PAYMENT_ALREADY_ACTIVE' },
              message: {
                type: 'string',
                example: 'Payment aktif sudah ada untuk order ini',
              },
            },
          },
        },
      },
    },
  },
};

const paymentOrderNotReadyResponse = {
  description: 'Order belum siap untuk dibayar',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'PAYMENT_ORDER_NOT_READY' },
              message: {
                type: 'string',
                example: 'Order belum siap untuk dibayar',
              },
            },
          },
        },
      },
    },
  },
};

const paymentAmountMismatchResponse = {
  description: 'Jumlah pembayaran tidak sesuai dengan total order',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'PAYMENT_AMOUNT_MISMATCH' },
              message: {
                type: 'string',
                example: 'Jumlah pembayaran tidak sesuai dengan total order',
              },
            },
          },
        },
      },
    },
  },
};

const paymentCreateRuleResponse = {
  description: 'Order belum siap atau jumlah pembayaran tidak sesuai',
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
                example: 'PAYMENT_ORDER_NOT_READY',
                enum: ['PAYMENT_ORDER_NOT_READY', 'PAYMENT_AMOUNT_MISMATCH'],
              },
              message: {
                type: 'string',
                example: 'Order belum siap untuk dibayar',
              },
            },
          },
        },
      },
    },
  },
};

const paymentWebhookSignatureInvalidResponse = {
  description: 'Signature webhook tidak valid',
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
                example: 'PAYMENT_WEBHOOK_SIGNATURE_INVALID',
              },
              message: {
                type: 'string',
                example: 'Signature webhook tidak valid',
              },
            },
          },
        },
      },
    },
  },
};

const paymentWebhookInvalidPayloadResponse = {
  description: 'Payload webhook tidak valid',
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
                example: 'PAYMENT_WEBHOOK_INVALID_PAYLOAD',
              },
              message: {
                type: 'string',
                example: 'Payload webhook tidak valid',
              },
            },
          },
        },
      },
    },
  },
};

const paymentMidtransFailedResponse = {
  description: 'Gagal membuat transaksi ke Midtrans',
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
                example: 'PAYMENT_MIDTRANS_REQUEST_FAILED',
              },
              message: {
                type: 'string',
                example: 'Gagal membuat transaksi ke Midtrans',
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

// ===========================
// Request Body Item Schemas
// ===========================

const orderItemInputSchema = {
  type: 'object',
  required: ['menu_item_id', 'quantity', 'item_price'],
  properties: {
    menu_item_id: {
      type: 'string',
      format: 'uuid',
      example: 'c2dd6e4g-h345-6f78-d901-222222222222',
      description: 'UUID menu item yang dipesan',
    },
    quantity: {
      type: 'integer',
      minimum: 1,
      maximum: 999,
      example: 2,
      description:
        'Jumlah item yang dipesan. Jika ada duplikat menu_item_id, quantity akan dijumlahkan.',
    },
    item_price: {
      type: 'number',
      minimum: 0,
      example: 25000,
      description:
        'Harga per item. Harus sesuai dengan harga di database (toleransi <= 1 rupiah).',
    },
    notes: {
      type: 'string',
      maxLength: 255,
      nullable: true,
      example: 'Tidak pedas',
      description: 'Catatan untuk item ini (opsional)',
    },
  },
};

const updateOrderItemInputSchema = {
  type: 'object',
  required: ['menu_item_id', 'quantity', 'item_price'],
  properties: {
    order_item_id: {
      type: 'string',
      format: 'uuid',
      nullable: true,
      example: 'b1cc5d3f-g234-5e67-c890-111111111111',
      description:
        'UUID item order yang sudah ada. Jika ada, item ini akan diupdate. Jika tidak ada, item baru akan ditambahkan.',
    },
    menu_item_id: {
      type: 'string',
      format: 'uuid',
      example: 'c2dd6e4g-h345-6f78-d901-222222222222',
      description: 'UUID menu item',
    },
    quantity: {
      type: 'integer',
      minimum: 1,
      maximum: 999,
      example: 3,
      description: 'Jumlah item',
    },
    item_price: {
      type: 'number',
      minimum: 0,
      example: 25000,
      description: 'Harga per item',
    },
    notes: {
      type: 'string',
      maxLength: 255,
      nullable: true,
      example: 'Tambah sambal',
      description: 'Catatan untuk item ini (opsional)',
    },
  },
};

const paymentAmountSchema = {
  type: 'object',
  required: ['amount'],
  properties: {
    amount: {
      type: 'number',
      minimum: 1,
      example: 55000,
      description:
        'Jumlah pembayaran. Harus sesuai dengan total_amount order (toleransi <= 1 rupiah).',
    },
  },
};

export const ordersSwaggerDoc = {
  tags: [
    {
      name: 'Orders',
      description:
        'Manajemen order — buat, lihat, perbarui, dan batalkan order per unit usaha. Order hanya bisa dibatalkan saat berstatus "menunggu".',
    },
  ],
  paths: {
    '/v1/orders/{unitId}': {
      get: {
        tags: ['Orders'],
        summary: 'Ambil daftar order',
        description:
          'Mengambil daftar order di unit usaha tertentu dengan dukungan filter status, pengurutan, dan pagination. Membutuhkan permission `order:read`.',
        security: bearerSecurity,
        parameters: [
          unitIdParam,
          {
            name: 'status_id',
            in: 'query',
            required: false,
            description:
              'Filter berdasarkan UUID status order. Jika tidak diisi, semua status ditampilkan.',
            schema: {
              type: 'string',
              format: 'uuid',
              example: '550e8400-e29b-41d4-a716-446655440002',
            },
          },
          {
            name: 'sortBy',
            in: 'query',
            required: false,
            description: 'Kolom untuk pengurutan (default: ordered_at)',
            schema: {
              type: 'string',
              enum: ['ordered_at', 'total_amount', 'customer_name'],
              default: 'ordered_at',
              example: 'ordered_at',
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
            description: 'Daftar order berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Data order berhasil diambil',
                    },
                    data: { type: 'array', items: orderListItemSchema },
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
        tags: ['Orders'],
        summary: 'Buat order baru',
        description:
          'Membuat order baru di unit usaha tertentu. Backend akan memvalidasi ketersediaan menu, kesesuaian harga (toleransi <= 1 rupiah), dan konsistensi subtotal/total. Nomor order di-generate otomatis dengan format `ORD-YYYYMMDD-XXXX`. Membutuhkan permission `order:read` dan `order:create`.',
        security: bearerSecurity,
        parameters: [unitIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: [
                  'order_type_id',
                  'customer_name',
                  'items',
                  'subtotal',
                  'tax_amount',
                  'total_amount',
                ],
                properties: {
                  order_type_id: {
                    type: 'string',
                    format: 'uuid',
                    example: '550e8400-e29b-41d4-a716-446655440001',
                    description: 'UUID tipe order (dine-in atau takeaway)',
                  },
                  customer_name: {
                    type: 'string',
                    maxLength: 255,
                    example: 'Budi Santoso',
                    description: 'Nama pelanggan',
                  },
                  table_number: {
                    type: 'string',
                    maxLength: 255,
                    nullable: true,
                    example: '5',
                    description:
                      'Nomor meja. Wajib diisi untuk tipe dine-in, harus kosong/tidak dikirim untuk takeaway.',
                  },
                  notes: {
                    type: 'string',
                    maxLength: 255,
                    nullable: true,
                    example: 'Tolong siapkan cepat',
                    description:
                      'Catatan untuk order secara keseluruhan (opsional)',
                  },
                  items: {
                    type: 'array',
                    minItems: 1,
                    items: orderItemInputSchema,
                    description:
                      'Daftar item yang dipesan. Minimal 1 item. Duplikat menu_item_id akan digabung (quantity dijumlahkan).',
                  },
                  subtotal: {
                    type: 'number',
                    minimum: 0,
                    example: 50000,
                    description:
                      'Total sebelum pajak. Harus sesuai dengan sum(item_price * quantity) dengan toleransi <= 1 rupiah.',
                  },
                  tax_amount: {
                    type: 'number',
                    minimum: 0,
                    example: 5000,
                    description: 'Jumlah pajak',
                  },
                  total_amount: {
                    type: 'number',
                    minimum: 0,
                    example: 55000,
                    description:
                      'Total pembayaran. Harus sesuai dengan subtotal + tax_amount dengan toleransi <= 1 rupiah.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '201': {
            description: 'Order berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 201 },
                    message: {
                      type: 'string',
                      example: 'Order berhasil dibuat',
                    },
                    data: orderDetailSchema,
                  },
                },
              },
            },
          },
          '400': {
            description:
              'Validasi gagal atau aturan bisnis table_number tidak terpenuhi',
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
                          enum: ['VALIDATION_FAILED'],
                        },
                        message: {
                          type: 'string',
                          example:
                            'Nomor meja wajib diisi untuk tipe order dine-in',
                        },
                        details: { type: 'array', items: { type: 'object' } },
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
            description:
              'Unit usaha, tipe order, atau item order tidak ditemukan',
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
                          example: 'ORDER_TYPE_NOT_FOUND',
                          enum: ['UNIT_NOT_FOUND', 'ORDER_TYPE_NOT_FOUND'],
                        },
                        message: {
                          type: 'string',
                          example: 'Tipe order tidak ditemukan',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '422': {
            description:
              'Aturan bisnis dilanggar: harga tidak sesuai, menu tidak tersedia, atau menu tidak terdaftar di unit ini',
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
                          example: 'ORDER_PRICE_MISMATCH',
                          enum: [
                            'ORDER_MENU_NOT_AVAILABLE',
                            'ORDER_MENU_NOT_IN_UNIT',
                            'ORDER_PRICE_MISMATCH',
                          ],
                        },
                        message: {
                          type: 'string',
                          example:
                            'Harga menu "Nasi Goreng Spesial" tidak sesuai dengan harga yang berlaku',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/orders/{unitId}/{orderId}': {
      get: {
        tags: ['Orders'],
        summary: 'Ambil detail order',
        description:
          'Mengambil detail lengkap satu order termasuk semua item yang dipesan. Membutuhkan permission `order:read`.',
        security: bearerSecurity,
        parameters: [unitIdParam, orderIdParam],
        responses: {
          '200': {
            description: 'Detail order berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Detail order berhasil diambil',
                    },
                    data: orderDetailSchema,
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': orderNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
      patch: {
        tags: ['Orders'],
        summary: 'Perbarui order (partial)',
        description:
          'Memperbarui data order secara parsial. Minimal satu field harus dikirim. Order tidak dapat diperbarui jika statusnya sudah "selesai". Jika items dikirim, strategi yang digunakan adalah replace: item yang tidak disertakan akan dihapus, item dengan order_item_id akan diupdate, item tanpa order_item_id akan ditambahkan. Jika items diubah, subtotal dan total_amount wajib disertakan. Membutuhkan permission `order:read` dan `order:update`.',
        security: bearerSecurity,
        parameters: [unitIdParam, orderIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  order_type_id: {
                    type: 'string',
                    format: 'uuid',
                    example: '550e8400-e29b-41d4-a716-446655440001',
                    description: 'UUID tipe order baru (opsional)',
                  },
                  customer_name: {
                    type: 'string',
                    maxLength: 255,
                    example: 'Andi Wijaya',
                    description: 'Nama pelanggan baru (opsional)',
                  },
                  table_number: {
                    type: 'string',
                    maxLength: 255,
                    nullable: true,
                    example: '7',
                    description:
                      'Nomor meja baru. Wajib untuk dine-in, tidak boleh ada untuk takeaway.',
                  },
                  notes: {
                    type: 'string',
                    maxLength: 255,
                    nullable: true,
                    example: 'Pelanggan alergi kacang',
                    description: 'Catatan order (opsional)',
                  },
                  items: {
                    type: 'array',
                    minItems: 1,
                    items: updateOrderItemInputSchema,
                    description:
                      'Daftar item order (opsional). Jika dikirim, item yang tidak disertakan akan dihapus.',
                  },
                  subtotal: {
                    type: 'number',
                    minimum: 0,
                    example: 75000,
                    description:
                      'Total sebelum pajak. Wajib jika items dikirim.',
                  },
                  tax_amount: {
                    type: 'number',
                    minimum: 0,
                    example: 7500,
                    description: 'Jumlah pajak (opsional)',
                  },
                  total_amount: {
                    type: 'number',
                    minimum: 0,
                    example: 82500,
                    description: 'Total pembayaran. Wajib jika items dikirim.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Order berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Order berhasil diperbarui',
                    },
                    data: orderDetailSchema,
                  },
                },
              },
            },
          },
          '400': {
            description:
              'Validasi gagal, body kosong, atau aturan bisnis table_number/pricing dilanggar',
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
                          enum: ['VALIDATION_FAILED'],
                        },
                        message: {
                          type: 'string',
                          example:
                            'Minimal satu field harus diisi untuk melakukan pembaruan',
                        },
                        details: { type: 'array', items: { type: 'object' } },
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
            description:
              'Unit usaha, order, tipe order, atau item order tidak ditemukan',
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
                          example: 'ORDER_NOT_FOUND',
                          enum: [
                            'UNIT_NOT_FOUND',
                            'ORDER_NOT_FOUND',
                            'ORDER_TYPE_NOT_FOUND',
                            'ORDER_ITEM_NOT_FOUND',
                          ],
                        },
                        message: {
                          type: 'string',
                          example: 'Order tidak ditemukan',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '422': {
            description:
              'Aturan bisnis dilanggar: order sudah selesai, harga tidak sesuai, atau menu tidak tersedia',
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
                          example: 'ORDER_ALREADY_COMPLETED',
                          enum: [
                            'ORDER_ALREADY_COMPLETED',
                            'ORDER_MENU_NOT_AVAILABLE',
                            'ORDER_MENU_NOT_IN_UNIT',
                            'ORDER_PRICE_MISMATCH',
                          ],
                        },
                        message: {
                          type: 'string',
                          example: 'Order sudah selesai dan tidak dapat diubah',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '500': internalServerErrorResponse,
        },
      },
      delete: {
        tags: ['Orders'],
        summary: 'Batalkan order',
        description:
          'Membatalkan order secara soft-delete dan mengubah statusnya menjadi cancelled. Hanya order dengan status "menunggu" yang dapat dibatalkan. Order yang sudah diproses, siap, atau selesai tidak dapat dibatalkan. Semua item order juga akan di-soft-delete. Membutuhkan permission `order:read` dan `order:delete`.',
        security: bearerSecurity,
        parameters: [unitIdParam, orderIdParam],
        responses: {
          '200': {
            description: 'Order berhasil dibatalkan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Order berhasil dibatalkan',
                    },
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': orderNotFoundResponse,
          '422': {
            description:
              'Order tidak dapat dibatalkan karena statusnya bukan "menunggu"',
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
                          example: 'ORDER_CANNOT_BE_CANCELLED',
                          enum: ['ORDER_CANNOT_BE_CANCELLED'],
                        },
                        message: {
                          type: 'string',
                          example:
                            'Order hanya dapat dibatalkan saat berstatus menunggu',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/orders/{unitId}/{orderId}/payments/cashless': {
      post: {
        tags: ['Orders'],
        summary: 'Buat payment cashless (Midtrans Snap)',
        description:
          'Membuat payment cashless untuk order yang berstatus "siap". Mengembalikan snap_token dan redirect_url dari Midtrans. Membutuhkan permission `payment:process`.',
        security: bearerSecurity,
        parameters: [unitIdParam, orderIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: paymentAmountSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Payment cashless berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 201 },
                    message: {
                      type: 'string',
                      example: 'Payment cashless berhasil dibuat',
                    },
                    data: paymentCashlessResponseSchema,
                  },
                },
              },
            },
          },
          '400': validationErrorResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': orderNotFoundResponse,
          '409': paymentAlreadyActiveResponse,
          '422': paymentCreateRuleResponse,
          '500': internalServerErrorResponse,
          '502': paymentMidtransFailedResponse,
        },
      },
    },
    '/v1/orders/{unitId}/{orderId}/payments/cash': {
      post: {
        tags: ['Orders'],
        summary: 'Buat payment cash',
        description:
          'Membuat payment cash untuk order yang berstatus "siap". Status payment langsung "paid". Membutuhkan permission `payment:process`.',
        security: bearerSecurity,
        parameters: [unitIdParam, orderIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: paymentAmountSchema,
            },
          },
        },
        responses: {
          '201': {
            description: 'Payment cash berhasil dibuat',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 201 },
                    message: {
                      type: 'string',
                      example: 'Payment cash berhasil dibuat',
                    },
                    data: paymentResponseSchema,
                  },
                },
              },
            },
          },
          '400': validationErrorResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': orderNotFoundResponse,
          '409': paymentAlreadyActiveResponse,
          '422': paymentCreateRuleResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/orders/{unitId}/{orderId}/payments': {
      get: {
        tags: ['Orders'],
        summary: 'Ambil daftar payment per order',
        description:
          'Mengambil daftar payment untuk order tertentu. Membutuhkan permission `payment:read`.',
        security: bearerSecurity,
        parameters: [unitIdParam, orderIdParam],
        responses: {
          '200': {
            description: 'Daftar payment berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Data payment berhasil diambil',
                    },
                    data: { type: 'array', items: paymentResponseSchema },
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': orderNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/orders/{unitId}/{orderId}/payments/{paymentId}': {
      get: {
        tags: ['Orders'],
        summary: 'Ambil detail payment',
        description:
          'Mengambil detail payment tertentu untuk order. Membutuhkan permission `payment:read`.',
        security: bearerSecurity,
        parameters: [unitIdParam, orderIdParam, paymentIdParam],
        responses: {
          '200': {
            description: 'Detail payment berhasil diambil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Detail payment berhasil diambil',
                    },
                    data: paymentResponseSchema,
                  },
                },
              },
            },
          },
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': paymentDetailNotFoundResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/orders/payments/midtrans/webhook': {
      post: {
        tags: ['Orders'],
        summary: 'Webhook Midtrans',
        description:
          'Endpoint webhook publik untuk menerima update status transaksi dari Midtrans. Signature diverifikasi menggunakan server key.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  order_id: {
                    type: 'string',
                    example: 'PAY-ORD-20250115-0001-20250115103045',
                  },
                  status_code: { type: 'string', example: '200' },
                  gross_amount: { type: 'string', example: '55000' },
                  transaction_status: { type: 'string', example: 'settlement' },
                  fraud_status: { type: 'string', example: 'accept' },
                  signature_key: { type: 'string', example: 'sha512-hash' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Webhook diterima',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'Webhook diterima' },
                  },
                },
              },
            },
          },
          '400': paymentWebhookInvalidPayloadResponse,
          '401': paymentWebhookSignatureInvalidResponse,
          '422': paymentAmountMismatchResponse,
          '500': internalServerErrorResponse,
        },
      },
    },
  },
};
