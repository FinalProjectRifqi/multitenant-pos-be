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

export const inventoryInvalidTransactionTypeError = (
  details?: unknown,
): AppError =>
  new AppError({
    code: DomainErrorCodes.InventoryInvalidTransactionType,
    message: 'Tipe transaksi inventaris tidak valid',
    status: 400,
    details,
  });
