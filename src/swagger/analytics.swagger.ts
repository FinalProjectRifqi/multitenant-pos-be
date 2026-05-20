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

const periodQueryParam = {
  name: 'period',
  in: 'query',
  required: false,
  description:
    'Rentang waktu analitik. Default: 7d.\n\n' +
    '- `today` — Hari ini\n' +
    '- `7d` — 7 hari terakhir\n' +
    '- `30d` — 30 hari terakhir\n' +
    '- `month` — Bulan kalender berjalan\n' +
    '- `quarter` — 3 bulan terakhir',
  schema: {
    type: 'string',
    enum: ['today', '7d', '30d', 'month', 'quarter'],
    default: '7d',
    example: '7d',
  },
};

// ===========================
// Schema: KPI
// ===========================

const kpiDataSchema = {
  type: 'object',
  properties: {
    total_omzet: {
      type: 'number',
      description: 'Total omzet dalam periode',
      example: 5250000,
    },
    total_transaksi: {
      type: 'integer',
      description: 'Jumlah transaksi dalam periode',
      example: 87,
    },
    rata_rata_order: {
      type: 'number',
      description: 'Rata-rata nilai order per transaksi',
      example: 60344,
    },
    selesai: {
      type: 'integer',
      description: 'Jumlah order dengan status SELESAI',
      example: 82,
    },
    dibatalkan: {
      type: 'integer',
      description: 'Jumlah order dengan status DIBATALKAN',
      example: 5,
    },
    stok_kritis: {
      type: 'integer',
      description: 'Jumlah item inventaris yang stoknya di bawah batas minimum',
      example: 3,
    },
    omzet_growth_pct: {
      type: 'number',
      nullable: true,
      description:
        'Persentase pertumbuhan omzet dibanding periode sebelumnya. Null jika tidak ada data periode sebelumnya.',
      example: 12,
    },
    transaksi_growth_pct: {
      type: 'number',
      nullable: true,
      description:
        'Persentase pertumbuhan jumlah transaksi dibanding periode sebelumnya.',
      example: 8,
    },
    avg_growth_pct: {
      type: 'number',
      nullable: true,
      description:
        'Persentase pertumbuhan rata-rata order dibanding periode sebelumnya.',
      example: -5,
    },
  },
};

// ===========================
// Schema: Sales Trend
// ===========================

const salesTrendPointSchema = {
  type: 'object',
  properties: {
    label: {
      type: 'string',
      description:
        'Label tampilan untuk sumbu X (misal: "Sen", "01/05", "Mei")',
      example: 'Sen',
    },
    date: {
      type: 'string',
      description: 'Tanggal bucket dalam format YYYY-MM-DD',
      example: '2026-05-13',
    },
    omzet: {
      type: 'number',
      description: 'Total omzet pada tanggal tersebut',
      example: 750000,
    },
    transaksi: {
      type: 'integer',
      description: 'Jumlah transaksi pada tanggal tersebut',
      example: 12,
    },
  },
};

// ===========================
// Schema: Top Menus
// ===========================

const topMenuRowSchema = {
  type: 'object',
  properties: {
    menu_item_id: {
      type: 'string',
      format: 'uuid',
      example: 'a3bb4c2e-f123-4d56-b789-000000000010',
    },
    menu_item_name: {
      type: 'string',
      example: 'Nasi Goreng Spesial',
    },
    category_name: {
      type: 'string',
      example: 'Makanan Berat',
    },
    qty_terjual: {
      type: 'integer',
      description: 'Total kuantitas terjual dalam periode',
      example: 47,
    },
    pendapatan: {
      type: 'number',
      description: 'Total pendapatan dari menu ini',
      example: 1175000,
    },
  },
};

// ===========================
// Schema: Recent Payments
// ===========================

const paymentHistoryRowSchema = {
  type: 'object',
  properties: {
    payment_id: {
      type: 'string',
      format: 'uuid',
      example: 'f1cc5d3f-a234-4e67-b890-111111111111',
    },
    reference_number: {
      type: 'string',
      description: 'Nomor referensi unik pembayaran',
      example: 'PAY-20260519-0001',
    },
    order_number: {
      type: 'string',
      description: 'Nomor order terkait',
      example: 'ORD-20260519-0042',
    },
    amount: {
      type: 'number',
      description: 'Jumlah nominal pembayaran',
      example: 75000,
    },
    payment_method: {
      type: 'string',
      description:
        'Metode pembayaran — "QRIS" jika ada qr_string, "Tunai" jika tidak',
      enum: ['QRIS', 'Tunai'],
      example: 'QRIS',
    },
    payment_status: {
      type: 'string',
      description: 'Status pembayaran (selalu "paid" pada endpoint ini)',
      enum: ['paid'],
      example: 'paid',
    },
    created_at: {
      type: 'string',
      format: 'date-time',
      example: '2026-05-19T09:30:00.000Z',
    },
  },
};

// ===========================
// Schema: Inventory Status
// ===========================

const inventoryStatusRowSchema = {
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
    current_stock: {
      type: 'number',
      description: 'Stok saat ini',
      example: 8,
    },
    min_threshold: {
      type: 'number',
      description: 'Batas minimum stok',
      example: 20,
    },
    unit_of_measure: {
      type: 'string',
      description: 'Satuan stok (misal: kg, pcs, liter)',
      example: 'kg',
    },
    status: {
      type: 'string',
      enum: ['LOW', 'CRITICAL', 'OUT'],
      description:
        '- `OUT` — Stok = 0\n' +
        '- `CRITICAL` — Stok > 0 dan stok < 50% dari min_threshold\n' +
        '- `LOW` — Stok > 0 dan stok antara 50%–100% dari min_threshold',
      example: 'CRITICAL',
    },
  },
};

// ===========================
// Schema: Daily Inventory
// ===========================

const dailyInventoryRowSchema = {
  type: 'object',
  properties: {
    inventory_item_name: {
      type: 'string',
      example: 'Beras Premium',
    },
    unit: {
      type: 'string',
      description: 'Satuan penggunaan',
      example: 'kg',
    },
    planned_usage_qty: {
      type: 'number',
      description: 'Rencana penggunaan',
      example: 10,
    },
    actual_usage_qty: {
      type: 'number',
      description: 'Realisasi penggunaan (0 jika belum diisi)',
      example: 9,
    },
    waste_qty: {
      type: 'number',
      nullable: true,
      description: 'Jumlah waste. Null jika belum diisi.',
      example: 1,
    },
    variance_qty: {
      type: 'number',
      description: 'Selisih antara rencana dan realisasi (0 jika belum diisi)',
      example: -1,
    },
  },
};

// ===========================
// Reusable error schemas
// ===========================

const notFoundResponse = {
  description: 'Unit tidak ditemukan',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'NOT_FOUND' },
              message: { type: 'string', example: 'Unit tidak ditemukan' },
            },
          },
        },
      },
    },
  },
};

const unauthorizedResponse = {
  description: 'Token tidak ada atau tidak valid',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'AUTH_TOKEN_MISSING' },
              message: { type: 'string', example: 'Token tidak ditemukan' },
            },
          },
        },
      },
    },
  },
};

const forbiddenResponse = {
  description: 'Tidak memiliki izin analytics:read',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string', example: 'FORBIDDEN' },
              message: { type: 'string', example: 'Akses ditolak' },
            },
          },
        },
      },
    },
  },
};

// ===========================
// Swagger Doc Export
// ===========================

export const analyticsSwaggerDoc = {
  tags: [
    {
      name: 'Analytics',
      description:
        'Laporan analitik per unit usaha (KPI, tren penjualan, menu terlaris, pembayaran, inventaris)',
    },
  ],
  paths: {
    // ─── KPI ───────────────────────────────────────────────────────────────────
    '/v1/analytics/{unitId}/kpi': {
      get: {
        tags: ['Analytics'],
        summary: 'Ambil KPI ringkasan',
        description:
          'Mengembalikan KPI ringkasan untuk unit usaha dalam rentang periode tertentu, ' +
          'beserta persentase pertumbuhan dibanding periode sebelumnya.',
        security: bearerSecurity,
        parameters: [unitIdParam, periodQueryParam],
        responses: {
          200: {
            description: 'Berhasil mengambil data KPI analytics',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'integer', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Berhasil mengambil data KPI analytics',
                    },
                    data: kpiDataSchema,
                  },
                },
              },
            },
          },
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
    },

    // ─── Sales Trend ───────────────────────────────────────────────────────────
    '/v1/analytics/{unitId}/sales-trend': {
      get: {
        tags: ['Analytics'],
        summary: 'Ambil data tren penjualan',
        description:
          'Mengembalikan data tren penjualan (omzet & transaksi) per hari dalam rentang periode. ' +
          'Setiap titik data berisi label tampilan dan nilai aggregat.',
        security: bearerSecurity,
        parameters: [unitIdParam, periodQueryParam],
        responses: {
          200: {
            description: 'Berhasil mengambil data tren penjualan',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'integer', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Berhasil mengambil data tren penjualan',
                    },
                    data: {
                      type: 'array',
                      items: salesTrendPointSchema,
                      example: [
                        {
                          label: 'Sen',
                          date: '2026-05-13',
                          omzet: 750000,
                          transaksi: 12,
                        },
                        {
                          label: 'Sel',
                          date: '2026-05-14',
                          omzet: 820000,
                          transaksi: 14,
                        },
                      ],
                    },
                  },
                },
              },
            },
          },
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
    },

    // ─── Top Menus ─────────────────────────────────────────────────────────────
    '/v1/analytics/{unitId}/top-menus': {
      get: {
        tags: ['Analytics'],
        summary: 'Ambil 5 menu terlaris',
        description:
          'Mengembalikan hingga 5 menu dengan kuantitas terjual tertinggi dalam periode, ' +
          'diurutkan dari yang paling banyak terjual.',
        security: bearerSecurity,
        parameters: [unitIdParam, periodQueryParam],
        responses: {
          200: {
            description: 'Berhasil mengambil data menu terlaris',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'integer', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Berhasil mengambil data menu terlaris',
                    },
                    data: {
                      type: 'array',
                      maxItems: 5,
                      items: topMenuRowSchema,
                    },
                  },
                },
              },
            },
          },
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
    },

    // ─── Recent Payments ───────────────────────────────────────────────────────
    '/v1/analytics/{unitId}/payments': {
      get: {
        tags: ['Analytics'],
        summary: 'Ambil 10 pembayaran terbaru',
        description:
          'Mengembalikan 10 transaksi pembayaran terbaru dengan status `paid`, ' +
          'diurutkan dari yang paling baru. Metode pembayaran diturunkan dari: ' +
          '"QRIS" jika ada qr_string, "Tunai" jika tidak.',
        security: bearerSecurity,
        parameters: [unitIdParam],
        responses: {
          200: {
            description: 'Berhasil mengambil riwayat pembayaran',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'integer', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Berhasil mengambil riwayat pembayaran',
                    },
                    data: {
                      type: 'array',
                      maxItems: 10,
                      items: paymentHistoryRowSchema,
                    },
                  },
                },
              },
            },
          },
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
    },

    // ─── Inventory Status ──────────────────────────────────────────────────────
    '/v1/analytics/{unitId}/inventory-status': {
      get: {
        tags: ['Analytics'],
        summary: 'Ambil status stok inventaris',
        description:
          'Mengembalikan daftar item inventaris yang stoknya perlu perhatian, ' +
          'dikelompokkan menjadi:\n\n' +
          '- `low_or_critical` — Stok rendah (LOW) atau kritis (CRITICAL) tapi belum habis\n' +
          '- `out_of_stock` — Stok habis (stock = 0)\n\n' +
          '**Logika status:**\n' +
          '- `OUT`: stock = 0\n' +
          '- `CRITICAL`: stock > 0 dan stock < 50% dari min_threshold\n' +
          '- `LOW`: stock > 0 dan stock antara 50%–100% dari min_threshold',
        security: bearerSecurity,
        parameters: [unitIdParam],
        responses: {
          200: {
            description: 'Berhasil mengambil status inventaris',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'integer', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Berhasil mengambil status inventaris',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        low_or_critical: {
                          type: 'array',
                          description: 'Item dengan status LOW atau CRITICAL',
                          items: inventoryStatusRowSchema,
                        },
                        out_of_stock: {
                          type: 'array',
                          description: 'Item dengan status OUT (stok habis)',
                          items: inventoryStatusRowSchema,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
    },

    // ─── Daily Inventory ───────────────────────────────────────────────────────
    '/v1/analytics/{unitId}/daily-inventory': {
      get: {
        tags: ['Analytics'],
        summary: 'Ambil penggunaan inventaris harian',
        description:
          'Mengembalikan data rencana vs realisasi penggunaan inventaris pada tanggal tertentu. ' +
          'Jika parameter `date` tidak disertakan, default ke hari ini. ' +
          'Kolom `waste_qty` dan `variance_qty` bisa null jika realisasi belum diisi.',
        security: bearerSecurity,
        parameters: [
          unitIdParam,
          {
            name: 'date',
            in: 'query',
            required: false,
            description:
              'Tanggal target dalam format YYYY-MM-DD. Default: hari ini.',
            schema: {
              type: 'string',
              format: 'date',
              example: '2026-05-19',
            },
          },
        ],
        responses: {
          200: {
            description: 'Berhasil mengambil data inventaris harian',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'integer', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Berhasil mengambil data inventaris harian',
                    },
                    data: {
                      type: 'array',
                      items: dailyInventoryRowSchema,
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Format tanggal tidak valid',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: {
                      type: 'object',
                      properties: {
                        code: { type: 'string', example: 'VALIDATION_ERROR' },
                        message: {
                          type: 'string',
                          example: 'date harus berformat ISO 8601 (YYYY-MM-DD)',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: unauthorizedResponse,
          403: forbiddenResponse,
          404: notFoundResponse,
        },
      },
    },

    // ─── Group Summary ─────────────────────────────────────────────────────────
    '/v1/analytics/group/summary': {
      get: {
        tags: ['Analytics'],
        summary: 'Ringkasan analytics seluruh unit (Group Management)',
        description:
          'Mengembalikan KPI agregat, tren penjualan, top menu, dan tabel performa per unit untuk semua unit aktif. ' +
          'Hanya dapat diakses oleh role GROUP_MANAGEMENT dengan permission analytics:read.',
        security: bearerSecurity,
        parameters: [periodQueryParam],
        responses: {
          200: {
            description: 'Berhasil mengambil ringkasan analytics grup',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'integer', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Berhasil mengambil ringkasan analytics grup',
                    },
                    data: {
                      type: 'object',
                      properties: {
                        kpi: {
                          type: 'object',
                          properties: {
                            total_omzet: { type: 'number', example: 50000000 },
                            total_transaksi: { type: 'integer', example: 500 },
                            rata_rata_order: {
                              type: 'number',
                              example: 100000,
                            },
                            selesai: { type: 'integer', example: 470 },
                            dibatalkan: { type: 'integer', example: 30 },
                            stok_kritis: { type: 'integer', example: 5 },
                          },
                        },
                        sales_trend: {
                          type: 'array',
                          items: salesTrendPointSchema,
                        },
                        top_menus: {
                          type: 'array',
                          items: topMenuRowSchema,
                        },
                        unit_performance: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              unit_id: { type: 'string', format: 'uuid' },
                              unit_name: {
                                type: 'string',
                                example: 'Unit Pusat',
                              },
                              omzet: { type: 'number', example: 10000000 },
                              transaksi: { type: 'integer', example: 100 },
                              rata_rata_order: {
                                type: 'number',
                                example: 100000,
                              },
                              selesai: { type: 'integer', example: 95 },
                              dibatalkan: { type: 'integer', example: 5 },
                              stok_kritis: { type: 'integer', example: 1 },
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
          401: unauthorizedResponse,
          403: forbiddenResponse,
        },
      },
    },

    // ─── Group Compare ─────────────────────────────────────────────────────────
    '/v1/analytics/group/compare': {
      get: {
        tags: ['Analytics'],
        summary: 'Perbandingan KPI antar unit (Group Management)',
        description:
          'Mengembalikan data KPI untuk unit-unit yang dipilih dalam rentang waktu tertentu, ' +
          'digunakan untuk membandingkan performa antar unit secara visual. ' +
          'Hanya dapat diakses oleh role GROUP_MANAGEMENT dengan permission analytics:read.',
        security: bearerSecurity,
        parameters: [
          {
            name: 'unitIds',
            in: 'query',
            required: true,
            description: 'UUID unit yang ingin dibandingkan, dipisahkan koma.',
            schema: {
              type: 'string',
              example:
                '550e8400-e29b-41d4-a716-446655440000,660f8400-e29b-41d4-a716-446655440000',
            },
          },
          periodQueryParam,
        ],
        responses: {
          200: {
            description: 'Berhasil mengambil data perbandingan unit',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'integer', example: 200 },
                    message: {
                      type: 'string',
                      example: 'Berhasil mengambil data perbandingan unit',
                    },
                    data: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          unit_id: { type: 'string', format: 'uuid' },
                          unit_name: { type: 'string', example: 'Unit Pusat' },
                          omzet: { type: 'number', example: 10000000 },
                          transaksi: { type: 'integer', example: 100 },
                          rata_rata_order: { type: 'number', example: 100000 },
                          selesai: { type: 'integer', example: 95 },
                          dibatalkan: { type: 'integer', example: 5 },
                          stok_kritis: { type: 'integer', example: 3 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          400: {
            description: 'Parameter unitIds tidak valid',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: false },
                    error: {
                      type: 'object',
                      properties: {
                        code: { type: 'string', example: 'VALIDATION_ERROR' },
                        message: {
                          type: 'string',
                          example: 'unitIds wajib diisi',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          401: unauthorizedResponse,
          403: forbiddenResponse,
        },
      },
    },
  },
};
