export interface UpdateFileDto {
  file: Buffer;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  folder: string;
}
