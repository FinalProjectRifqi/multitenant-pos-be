export interface UploadFileDto {
  file: Buffer;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  folder: string;
}
