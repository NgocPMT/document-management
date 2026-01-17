import { APIError } from "encore.dev/api";
import FolderRepository from "./folders.repo";
import { FolderCreateDTO, FolderUpdateDTO } from "./folders.schema";

const FolderService = {
  get: async (userId: string) => {
    const folders = await FolderRepository.find(userId);
    return folders;
  },

  create: async (data: FolderCreateDTO & { userId: string }) => {
    const createdFolder = await FolderRepository.create(data);

    if (!createdFolder) {
      throw APIError.internal("Failed to create folder");
    }

    return createdFolder;
  },

  update: async (id: string, data: FolderUpdateDTO, userId: string) => {
    const updatedFolder = await FolderRepository.update(id, data, userId);

    if (!updatedFolder) {
      throw APIError.internal("Failed to update folder");
    }

    return updatedFolder;
  },

  delete: async (id: string, userId: string) => {
    const deletedFolder = await FolderRepository.delete(id, userId);

    if (!deletedFolder) {
      throw APIError.internal("Failed to delete folder");
    }

    return deletedFolder;
  },
};

export default FolderService;
