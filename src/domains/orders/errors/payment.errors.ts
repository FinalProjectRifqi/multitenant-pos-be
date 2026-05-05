import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const paymentNotFoundError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.PaymentNotFound,
    message: 'Payment tidak ditemukan',
    status: 404,
  });

export const paymentAlreadyActiveError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.PaymentAlreadyActive,
    message: 'Payment aktif sudah ada untuk order ini',
    status: 409,
  });

export const paymentOrderNotReadyError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.PaymentOrderNotReady,
    message: 'Order belum siap untuk dibayar',
    status: 422,
  });

export const paymentAmountMismatchError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.PaymentAmountMismatch,
    message: 'Jumlah pembayaran tidak sesuai dengan total order',
    status: 422,
  });

export const paymentWebhookSignatureInvalidError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.PaymentWebhookSignatureInvalid,
    message: 'Signature webhook tidak valid',
    status: 401,
  });

export const paymentWebhookInvalidPayloadError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.PaymentWebhookInvalidPayload,
    message: 'Payload webhook tidak valid',
    status: 400,
  });

export const paymentMidtransRequestFailedError = (): AppError =>
  new AppError({
    code: DomainErrorCodes.PaymentMidtransRequestFailed,
    message: 'Gagal membuat transaksi ke Midtrans',
    status: 502,
  });
