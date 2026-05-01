export const DomainErrorCodes = {
  OrderNotFound: 'ORDER_NOT_FOUND',
  AuthInvalidCredentials: 'AUTH_INVALID_CREDENTIALS',
  AuthInactiveAccount: 'AUTH_INACTIVE_ACCOUNT',
  AuthInvalidRole: 'AUTH_INVALID_ROLE',
} as const;

export type DomainErrorCode =
  (typeof DomainErrorCodes)[keyof typeof DomainErrorCodes];
