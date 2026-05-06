import { AppError } from '../../common/errors/app-error';
import { ErrorCodes } from '../../common/errors/error-codes';
import { orderKdsTransitionNotAllowedError } from './errors/order.errors';

/**
 * Normalize status identifiers from DB or client into a canonical uppercase code segment.
 */
export function resolveStatusCode(value: string): string {
  const normalized = value.trim().toUpperCase().replace(/\s+/g, '_');

  if (normalized === 'PENDING' || normalized === 'MENUNGGU') {
    return 'BARU_MASUK';
  }

  return normalized;
}

/**
 * Validates transitions for PATCH /orders (POS / order module flow)
 */
export function assertGeneralOrderStatusTransition(
  currentCode: string,
  nextCode: string,
): void {
  if (currentCode === nextCode) {
    throw new AppError({
      code: ErrorCodes.ValidationFailed,
      message: 'Status order tidak berubah',
      status: 400,
    });
  }

  if (nextCode === 'DIBATALKAN') {
    throw new AppError({
      code: ErrorCodes.ValidationFailed,
      message: 'Gunakan endpoint batal untuk membatalkan order',
      status: 400,
    });
  }

  const flow: Record<string, string[]> = {
    BARU_MASUK: ['SEDANG_DIPROSES'],
    SEDANG_DIPROSES: ['SIAP_DISAJIKAN'],
    SIAP_DISAJIKAN: ['SELESAI'],
    SELESAI: [],
    DIBATALKAN: [],
  };

  const allowed = flow[currentCode] ?? [];

  if (!allowed.includes(nextCode)) {
    throw new AppError({
      code: ErrorCodes.ValidationFailed,
      message: 'Perubahan status order tidak sesuai alur',
      status: 400,
    });
  }
}

/**
 * Validates transitions for Kitchen Display: only sampai SIAP_DISAJIKAN via transition route.
 */
export function assertKdsOrderStatusTransition(
  currentCode: string,
  nextCode: string,
): void {
  if (currentCode === nextCode) {
    throw new AppError({
      code: ErrorCodes.ValidationFailed,
      message: 'Status order tidak berubah',
      status: 400,
    });
  }

  if (nextCode === 'DIBATALKAN') {
    throw new AppError({
      code: ErrorCodes.ValidationFailed,
      message:
        'Gunakan endpoint pembatalan Kitchen Display untuk membatalkan order ini',
      status: 400,
    });
  }

  if (nextCode === 'SELESAI') {
    throw orderKdsTransitionNotAllowedError();
  }

  const flow: Record<string, string[]> = {
    BARU_MASUK: ['SEDANG_DIPROSES'],
    SEDANG_DIPROSES: ['SIAP_DISAJIKAN'],
    SIAP_DISAJIKAN: [],
    SELESAI: [],
    DIBATALKAN: [],
  };

  const allowed = flow[currentCode] ?? [];

  if (!allowed.includes(nextCode)) {
    throw new AppError({
      code: ErrorCodes.ValidationFailed,
      message:
        'Perubahan status ini tidak dapat dilakukan dari Kitchen Display. Selesai order dilakukan lewat modul order.',
      status: 400,
    });
  }
}
