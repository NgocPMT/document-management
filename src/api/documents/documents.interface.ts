export interface DocumentUpdateDTO {
  name?: string;
  folderId?: string;
  status?: string;
}

export interface DocumentListRequest {
  folderId?: string;
  limit: number;
  offset: number;
}
