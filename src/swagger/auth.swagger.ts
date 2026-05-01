export const authSwaggerDoc = {
  tags: [
    {
      name: 'Auth',
      description: 'Autentikasi dan otorisasi pengguna',
    },
  ],
  paths: {
    '/v1/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login pengguna',
        description:
          'Autentikasi pengguna menggunakan username dan password. Mengembalikan JWT Bearer token jika berhasil.',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: {
                    type: 'string',
                    example: 'johndoe',
                    description: 'Username pengguna (case-sensitive)',
                  },
                  password: {
                    type: 'string',
                    example: 'password123',
                    description: 'Password pengguna',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'Login berhasil',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    statusCode: { type: 'number', example: 200 },
                    message: { type: 'string', example: 'Login berhasil!' },
                    accessToken: {
                      type: 'string',
                      example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                      description:
                        'JWT Bearer token. Payload berisi: sub, typ, roles, permission, full_name, email, units, must_change_password',
                    },
                  },
                },
              },
            },
          },
          '400': {
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
                        code: {
                          type: 'string',
                          example: 'VALIDATION_FAILED',
                        },
                        message: {
                          type: 'string',
                          example: 'Request validation failed',
                        },
                        details: {
                          type: 'array',
                          items: { type: 'object' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description: 'Username atau password salah',
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
                          example: 'AUTH_INVALID_CREDENTIALS',
                        },
                        message: {
                          type: 'string',
                          example: 'Username atau password salah',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '403': {
            description: 'Akun tidak aktif atau role tidak valid',
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
                          example: 'AUTH_INACTIVE_ACCOUNT',
                          enum: ['AUTH_INACTIVE_ACCOUNT', 'AUTH_INVALID_ROLE'],
                        },
                        message: {
                          type: 'string',
                          example:
                            'Akun Anda tidak aktif. Hubungi administrator.',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '500': {
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
                        code: {
                          type: 'string',
                          example: 'INTERNAL_SERVER_ERROR',
                        },
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
          },
        },
      },
    },
  },
};
