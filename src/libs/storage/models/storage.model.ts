export interface LargeObjectRow {
  id_blob: string;
  file_name: string;
  stored_name: string;
  mime: string;
  path: string;
  size_bytes: number;
  uploaded_at: Date;
  deleted_at: Date | null;
}

export interface LargeObjectData {
  id_blob: string;
  file_name: string;
  stored_name: string;
  mime: string;
  path: string;
  size_bytes: number;
  uploaded_at: Date;
}

export interface LargeObjectDataWithUrl extends LargeObjectData {
  signed_url: string;
}

export interface UploadFileResult {
  success: true;
  statusCode: 201;
  message: string;
  data: LargeObjectData;
}

export interface GetFileResult {
  success: true;
  statusCode: 200;
  message: string;
  data: LargeObjectDataWithUrl;
}

export interface UpdateFileResult {
  success: true;
  statusCode: 200;
  message: string;
  data: LargeObjectData;
}

export interface DeleteFileResult {
  success: true;
  statusCode: 200;
  message: string;
}
