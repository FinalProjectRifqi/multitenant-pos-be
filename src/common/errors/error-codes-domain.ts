export const DomainErrorCodes = {
  OrderNotFound: 'ORDER_NOT_FOUND',
} as const;

export type DomainErrorCode =
  (typeof DomainErrorCodes)[keyof typeof DomainErrorCodes];
