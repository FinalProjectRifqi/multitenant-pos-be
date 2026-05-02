export const DomainErrorCodes = {
  OrderNotFound: 'ORDER_NOT_FOUND',
  AuthInvalidCredentials: 'AUTH_INVALID_CREDENTIALS',
  AuthInactiveAccount: 'AUTH_INACTIVE_ACCOUNT',
  AuthInvalidRole: 'AUTH_INVALID_ROLE',
  AuthTokenMissing: 'AUTH_TOKEN_MISSING',
  AuthTokenExpired: 'AUTH_TOKEN_EXPIRED',
  AuthTokenInvalid: 'AUTH_TOKEN_INVALID',
  AuthForbidden: 'AUTH_FORBIDDEN',
  UnitNotFound: 'UNIT_NOT_FOUND',
  UnitInvalidPhone: 'UNIT_INVALID_PHONE',
  RoleNotFound: 'ROLE_NOT_FOUND',
} as const;

export type DomainErrorCode =
  (typeof DomainErrorCodes)[keyof typeof DomainErrorCodes];
