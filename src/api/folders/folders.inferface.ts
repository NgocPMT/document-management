export interface FolderCreateDTO {
  name: string;
}

export interface FolderUpdateDTO {
  name?: string;
}

export interface FolderDTO {
  id: string;
  name: string;
  createdAt: Date;
}
