import { storageInvalidInputError } from './errors/storage.errors';

const MAX_FOLDER_CHARS = 512;
const MAX_SEGMENT_CHARS = 128;
const MAX_FOLDER_SEGMENTS = 16;
const MAX_FILENAME_CHARS = 255;

const SEGMENT_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9_-]*$/;

/** Everything before the last `/` in a storage object path (`folder/…/uuid.ext`). */
export function folderPrefixFromStoragePath(storagePath: string): string {
  const parts = storagePath.split('/');
  if (parts.length < 2) return '';
  return parts.slice(0, -1).join('/');
}

export function normalizeAndValidateStorageFolder(raw: string): string {
  let s = raw.trim();
  if (!s) {
    throw storageInvalidInputError('Folder wajib diisi');
  }

  s = s.replace(/^\/+/, '').replace(/\/+$/, '');
  while (s.includes('//')) {
    s = s.replace(/\/\/+/g, '/');
  }

  const segments = s.split('/').filter(Boolean);
  if (segments.length === 0) {
    throw storageInvalidInputError('Folder tidak valid');
  }
  if (segments.length > MAX_FOLDER_SEGMENTS) {
    throw storageInvalidInputError('Folder terlalu dalam');
  }

  for (const seg of segments) {
    if (seg === '.' || seg === '..') {
      throw storageInvalidInputError('Folder tidak boleh berisi "." atau ".."');
    }
    if (seg.length > MAX_SEGMENT_CHARS) {
      throw storageInvalidInputError('Segmen folder terlalu panjang');
    }
    if (!SEGMENT_PATTERN.test(seg)) {
      throw storageInvalidInputError(
        'Folder hanya boleh huruf, angka, underscore, dan hyphen per segmen',
      );
    }
  }

  const normalized = segments.join('/');
  if (normalized.length > MAX_FOLDER_CHARS) {
    throw storageInvalidInputError('Folder terlalu panjang');
  }

  return normalized;
}

export function validateStorageFileName(raw: string): string {
  const name = raw.trim();
  if (!name || name.length > MAX_FILENAME_CHARS) {
    throw storageInvalidInputError('Nama file tidak valid');
  }
  if (/[\u0000-\u001f\\/]/.test(name)) {
    throw storageInvalidInputError(
      'Nama file mengandung karakter tidak diizinkan',
    );
  }
  if (name === '.' || name === '..') {
    throw storageInvalidInputError('Nama file tidak valid');
  }
  return name;
}

export function validateUploadLikePayload(dto: {
  file: Buffer;
  fileName: string;
  folder: string;
  sizeBytes: number;
}): { folder: string; fileName: string } {
  if (!Buffer.isBuffer(dto.file)) {
    throw storageInvalidInputError('File harus berupa buffer');
  }
  if (dto.sizeBytes !== dto.file.length) {
    throw storageInvalidInputError(
      'Ukuran file (sizeBytes) harus sama dengan panjang buffer',
    );
  }

  const folder = normalizeAndValidateStorageFolder(dto.folder);
  const fileName = validateStorageFileName(dto.fileName);

  return { folder, fileName };
}
