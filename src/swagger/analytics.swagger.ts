const analyticsSuccessResponse = {
  description: 'Analytics report retrieved successfully',
  content: {
    'application/json': {
      examples: {
        success: {
          value: {
            success: true,
            statusCode: 200,
            message: 'Analytics report retrieved successfully',
            data: {
              totalRevenue: 12500000,
              totalTransactions: 240,
              averageOrderValue: 62500,
              completedTransactions: 200,
              cancelledTransactions: 8,
            },
          },
        },
      },
    },
  },
};

const validationResponse = {
  description: 'Request validation failed',
  content: {
    'application/json': {
      example: {
        success: false,
        message: 'Request validation failed',
        error: {
          code: 'VALIDATION_FAILED',
          details: 'startDate wajib diisi',
        },
      },
    },
  },
};

const unauthorizedResponse = {
  description: 'Token autentikasi tidak ditemukan atau tidak valid',
};

const forbiddenResponse = {
  description: 'Role tidak sesuai atau unit tidak boleh diakses',
  content: {
    'application/json': {
      example: {
        success: false,
        message: 'Anda tidak memiliki akses ke resource ini',
        error: {
          code: 'AUTH_FORBIDDEN',
          details: 'You are not allowed to access this unit report',
        },
      },
    },
  },
};

const serverErrorResponse = {
  description: 'Terjadi kesalahan internal',
};

const dateRangeParameters = [
  {
    name: 'startDate',
    in: 'query',
    required: true,
    schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    example: '2026-05-01',
  },
  {
    name: 'endDate',
    in: 'query',
    required: true,
    schema: { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$' },
    example: '2026-05-17',
  },
  {
    name: 'period',
    in: 'query',
    required: false,
    schema: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
    example: 'daily',
  },
];

export const analyticsSwaggerDoc = {
  tags: [
    {
      name: 'Analytics',
      description: 'Analytics reports for group management and unit managers',
    },
  ],
  paths: {
    '/v1/analytics/group/summary': {
      get: {
        tags: ['Analytics'],
        summary: 'Rangkuman analytics seluruh unit atau beberapa unit',
        security: [{ bearerAuth: [] }],
        parameters: [
          ...dateRangeParameters,
          {
            name: 'unitIds',
            in: 'query',
            required: false,
            schema: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
            },
            style: 'form',
            explode: true,
          },
        ],
        responses: {
          '200': analyticsSuccessResponse,
          '400': validationResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/analytics/group/units/{unitId}': {
      get: {
        tags: ['Analytics'],
        summary: 'Laporan analytics satu unit untuk Manajemen Grup',
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'unitId',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
          ...dateRangeParameters,
        ],
        responses: {
          '200': analyticsSuccessResponse,
          '400': validationResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/analytics/group/compare-units': {
      get: {
        tags: ['Analytics'],
        summary: 'Membandingkan performa beberapa unit',
        security: [{ bearerAuth: [] }],
        parameters: [
          ...dateRangeParameters,
          {
            name: 'unitIds',
            in: 'query',
            required: true,
            schema: {
              type: 'array',
              items: { type: 'string', format: 'uuid' },
            },
            style: 'form',
            explode: true,
          },
          {
            name: 'metrics',
            in: 'query',
            required: false,
            schema: {
              type: 'array',
              items: {
                type: 'string',
                enum: [
                  'revenue',
                  'transactions',
                  'averageOrderValue',
                  'completedTransactions',
                  'cancelledTransactions',
                  'bestSellingMenus',
                  'inventoryPerformance',
                  'criticalStock',
                ],
              },
            },
            style: 'form',
            explode: true,
          },
        ],
        responses: {
          '200': analyticsSuccessResponse,
          '400': validationResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '500': serverErrorResponse,
        },
      },
    },
    '/v1/analytics/unit/report': {
      get: {
        tags: ['Analytics'],
        summary: 'Laporan analytics unit yang ditugaskan ke Manajer Unit',
        security: [{ bearerAuth: [] }],
        parameters: [
          ...dateRangeParameters,
          {
            name: 'unitId',
            in: 'query',
            required: false,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': analyticsSuccessResponse,
          '400': validationResponse,
          '401': unauthorizedResponse,
          '403': forbiddenResponse,
          '500': serverErrorResponse,
        },
      },
    },
  },
};
