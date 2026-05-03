import type { TransformFnParams } from 'class-transformer';

/**
 * Trim string lalu ubah '' -> undefined supaya @IsOptional() benar-benar skip.
 * Untuk non-string biarkan apa adanya.
 */
export const emptyToUndefined = ({ value }: TransformFnParams): unknown => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

/**
 * Sama seperti emptyToUndefined, lalu parse ke number untuk multipart / query string.
 */
export const emptyToUndefinedThenNumber = ({
  value,
}: TransformFnParams): unknown => {
  if (value === undefined || value === null) return undefined;
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    return Number(trimmed);
  }
  return value;
};

/**
 * Empty string -> undefined, lalu mapping true/false seperti form multipart.
 */
export const emptyToUndefinedThenBoolean = ({
  value,
}: TransformFnParams): unknown => {
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    value = trimmed;
  }
  if (value === 'true' || value === true) return true;
  if (value === 'false' || value === false) return false;
  return value;
};
