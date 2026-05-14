const bearerSecurity = [{ bearerAuth: [] }];

const unauthorizedResponse = {
  description: 'Token tidak ada atau tidak valid',
};

const forbiddenResponse = {
  description: 'JWT valid tetapi tidak memiliki permission yang diperlukan',
};

const internalServerErrorResponse = {
  description: 'Galat internal server',
};

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

const orderDetailSwaggerSchema = {
  type: 'object',
  description:
    'Bentuk body `data` mengikuti response detail order pada GET `/v1/orders/{unitId}/{orderId}`.',
  additionalProperties: true,
};

/** @public dokumentasi tambahan untuk kode kesalahan */
const orderKdsValidationResponse = {
  description:
    'Validasi gagal (misalnya kombinasi order_status_id/kode salah, atau transisi tidak diizinkan untuk KDS). Dapat mencakup `ORDER_KDS_TRANSITION_NOT_ALLOWED` jika mencoba menyelesaikan order dari KDS.',
  content: {
    'application/json': {
      schema: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          statusCode: { type: 'number', example: 400 },
          error: {
            type: 'object',
            properties: {
              code: {
                type: 'string',
                example: 'ORDER_KDS_TRANSITION_NOT_ALLOWED',
                enum: ['VALIDATION_FAILED', 'ORDER_KDS_TRANSITION_NOT_ALLOWED'],
              },
              message: {
                type: 'string',
                example:
                  'Menyelesaikan order tidak dapat dilakukan dari Kitchen Display.',
              },
            },
          },
        },
      },
    },
  },
};

export const kdsOrderStatusSwaggerDoc = {
  tags: [
    {
      name: 'KitchenDisplayOrderStatus',
      description:
        'Operasional Kitchen Display: transisi status pesanan (sampai Siap Disajikan) dan pembatalan awal. Event domain dihasilkan secara in-process setelah berhasil.',
    },
  ],
  paths: {
    '/v1/order-status/{unitId}/{orderId}/transition': {
      post: {
        tags: ['KitchenDisplayOrderStatus'],
        summary: 'Transisi status order (KDS)',
        description:
          'Memindahkan status satu order mengikuti alur dapur saja: Baru Masuk → Sedang Diproses → Siap Disajikan. Menyelesaikan order (Selesai) tidak diizinkan di sini. Membutuhkan `order_status:read` dan `order_status:update`.',
        security: bearerSecurity,
        parameters: [unitIdParam, orderIdParam],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  order_status_id: {
                    type: 'string',
                    format: 'uuid',
                    description:
                      'UUID status tujuan. Kirim ini **atau** `order_status_code`, bukan keduanya.',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Status order berhasil diperbarui',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: {
                      type: 'string',
                      example:
                        'Status order berhasil diperbarui dari Kitchen Display',
                    },
                    data: orderDetailSwaggerSchema,
                  },
                },
              },
            },
          },
          '400': orderKdsValidationResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '404': {
            description: 'Unit, order, atau status order tidak ditemukan',
          },
          '422': {
            description:
              'Order sudah selesai atau sudah dibatalkan (bisnis tidak mengizinkan perubahan)',
          },
          '500': internalServerErrorResponse,
        },
      },
    },
    '/v1/order-status/{unitId}/{orderId}/cancel': {
      post: {
        tags: ['KitchenDisplayOrderStatus'],
        summary: 'Batalkan order (KDS)',
        description:
          'Membatalkan order hanya saat status masih setara Baru Masuk — sama seperti aturan pembatalan order utama. Pembatalan dilakukan melalui perubahan status ke dibatalkan. Membutuhkan `order_status:read` dan `order_status:delete`.',
        security: bearerSecurity,
        parameters: [unitIdParam, orderIdParam],
        responses: {
          '200': {
            description: 'Order dibatalkan',
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
          '404': {
            description: 'Unit atau order tidak ditemukan',
          },
          '422': {
            description:
              'Order tidak dapat dibatalkan pada status ini, atau sudah dibatalkan',
          },
          '500': internalServerErrorResponse,
        },
      },
    },
  },
};
