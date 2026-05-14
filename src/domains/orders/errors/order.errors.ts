import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const orderNotFoundError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderNotFound,
    message: 'Order tidak ditemukan',
    status: 404,
  });

export const orderTypeNotFoundError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderTypeNotFound,
    message: 'Tipe order tidak ditemukan',
    status: 404,
  });

export const orderStatusNotFoundError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderStatusNotFound,
    message: 'Status order tidak ditemukan',
    status: 404,
  });

export const orderAlreadyCompletedError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderAlreadyCompleted,
    message: 'Order sudah selesai dan tidak dapat diubah',
    status: 422,
  });

export const orderAlreadyCancelledError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderAlreadyCancelled,
    message: 'Order sudah dibatalkan',
    status: 422,
  });

export const orderCannotBeCancelledError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderCannotBeCancelled,
    message: 'Order hanya dapat dibatalkan saat berstatus baru masuk',
    status: 422,
  });

export const orderItemNotFoundError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderItemNotFound,
    message: 'Item order tidak ditemukan atau tidak milik order ini',
    status: 404,
  });

export const orderMenuNotAvailableError = (menuName: string): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderMenuNotAvailable,
    message: `Menu "${menuName}" tidak tersedia saat ini`,
    status: 422,
  });

export const orderMenuNotInUnitError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderMenuNotInUnit,
    message: 'Satu atau lebih menu tidak terdaftar di unit usaha ini',
    status: 422,
  });

export const orderPriceMismatchError = (menuName: string): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderPriceMismatch,
    message: `Harga menu "${menuName}" tidak sesuai dengan harga yang berlaku`,
    status: 422,
  });

export const orderKdsTransitionNotAllowedError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.OrderKdsTransitionNotAllowed,
    message:
      'Menyelesaikan order tidak dapat dilakukan dari Kitchen Display. Gunakan modul order.',
    status: 400,
  });
