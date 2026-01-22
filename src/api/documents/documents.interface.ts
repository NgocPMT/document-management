export interface DocumentUpdateRequest {
  name?: string;
  folderId?: string;
  status?: string;
}

export interface DocumentListRequest {
  folderId?: string;
  limit: number;
  offset: number;
}

export interface DocumentSearchRequest extends DocumentListRequest {
  search: string;
}

export interface DocumentShareRequest {
  userId: string;
  expiresAt: Date;
}
