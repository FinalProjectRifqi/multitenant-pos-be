import { AppError } from '../../../common/errors/app-error';
import { DomainErrorCodes } from '../../../common/errors/error-codes-domain';

export const inventoryUnitNotFoundError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.InventoryUnitNotFound,
    message: 'Unit usaha tidak ditemukan',
    status: 404,
    details,
  });

export const inventoryItemNotFoundError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.InventoryItemNotFound,
    message: 'Item inventaris tidak ditemukan',
    status: 404,
    details,
  });

export const inventoryItemConflictError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.InventoryItemConflict,
    message: 'Nama item inventaris sudah digunakan di unit usaha ini',
    status: 409,
    details,
  });

export const inventoryInsufficientStockError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.InventoryInsufficientStock,
    message: 'Stok inventaris tidak mencukupi untuk transaksi keluar',
    status: 400,
    details,
  });

export const inventoryUnitMismatchError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.InventoryUnitMismatch,
    message: 'Unit bahan harus sama dengan unit inventaris',
    status: 400,
    details,
  });

export const dailyInventoryPlanNotFoundError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.DailyInventoryPlanNotFound,
    message: 'Rencana penggunaan inventaris harian tidak ditemukan',
    status: 404,
    details,
  });

export const dailyInventoryPlanConflictError = (details?: unknown): AppError =>
  new AppError({
    code: DomainErrorCodes.DailyInventoryPlanConflict,
    message:
      'Rencana penggunaan untuk tanggal dan item inventaris ini sudah ada',
    status: 409,
    details,
  });

export const dailyInventoryPlanAlreadyRealizedError = (
  details?: unknown,
): AppError =>
  new AppError({
    code: DomainErrorCodes.DailyInventoryPlanAlreadyRealized,
    message: 'Rencana inventaris harian sudah memiliki realisasi',
    status: 409,
    details,
  });

export const dailyInventoryRealizationNotFoundError = (
  details?: unknown,
): AppError =>
  new AppError({
    code: DomainErrorCodes.DailyInventoryRealizationNotFound,
    message: 'Realisasi inventaris harian tidak ditemukan',
    status: 404,
    details,
  });

export const dailyInventoryRealizationConflictError = (
  details?: unknown,
): AppError =>
  new AppError({
    code: DomainErrorCodes.DailyInventoryRealizationConflict,
    message:
      'Realisasi untuk tanggal dan item inventaris ini sudah pernah disubmit',
    status: 409,
    details,
  });
