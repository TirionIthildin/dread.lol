export interface FileMeta {
  contentType: string;
  size: number;
}

export interface FileUploadResult {
  fid: string;
  path: string;
  size: number;
}
