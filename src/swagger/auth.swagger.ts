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
    '/v1/auth/me': {
      get: {
        tags: ['Auth'],
        summary: 'Ambil profil pengguna yang sedang login',
        description:
          'Mengambil data profil lengkap pengguna berdasarkan JWT Bearer token yang valid.',
        security: [{ bearerAuth: [] }],
        responses: {
          '200': {
            description: 'Data pengguna berhasil diambil',
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
                      type: 'object',
                      properties: {
                        user_id: {
                          type: 'string',
                          format: 'uuid',
                          example: 'a3bb4c2e-f123-4d56-b789-000000000001',
                        },
                        full_name: {
                          type: 'string',
                          example: 'Budi Santoso',
                        },
                        user_name: {
                          type: 'string',
                          example: 'budi.santoso',
                        },
                        email: {
                          type: 'string',
                          format: 'email',
                          example: 'budi@example.com',
                        },
                        role_id: {
                          type: 'string',
                          format: 'uuid',
                          nullable: true,
                          example: 'a3bb4c2e-f123-4d56-b789-000000000002',
                        },
                        role_name: {
                          type: 'string',
                          nullable: true,
                          example: 'Manajer Unit',
                        },
                        role_code: {
                          type: 'string',
                          example: 'UNIT_MANAGER',
                        },
                        status: {
                          type: 'string',
                          enum: ['active', 'inactive'],
                          example: 'active',
                        },
                        last_login: {
                          type: 'string',
                          format: 'date-time',
                          nullable: true,
                          example: '2026-05-05T08:00:00.000Z',
                        },
                        business_units: {
                          type: 'array',
                          items: {
                            type: 'object',
                            properties: {
                              business_unit_id: {
                                type: 'string',
                                format: 'uuid',
                                example: '550e8400-e29b-41d4-a716-446655440000',
                              },
                              business_unit_name: {
                                type: 'string',
                                example: 'XYZ Cabang Sudirman',
                              },
                            },
                          },
                        },
                        permissions: {
                          type: 'array',
                          items: { type: 'string' },
                          example: [
                            'inventory:read',
                            'menu:read',
                            'menu:update',
                          ],
                        },
                        must_change_password: {
                          type: 'boolean',
                          example: false,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          '401': {
            description:
              'Token autentikasi tidak ada, kadaluarsa, atau tidak valid',
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
          },
          '403': {
            description: 'Akun pengguna tidak aktif',
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
                          enum: ['AUTH_INACTIVE_ACCOUNT'],
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
