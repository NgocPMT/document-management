import { APIError } from "encore.dev/api";
import FolderRepository from "./folders.repo";
import { FolderCreateDTO, FolderUpdateDTO } from "./folders.schema";
import log from "encore.dev/log";

const FolderService = {
  get: async (userId: string) => {
    log.info("FolderService.get: Fetching folders", { userId });
    const folders = await FolderRepository.find(userId);
    log.info("FolderService.get: Folders fetched", { count: folders.length });
    return folders;
  },

  validateFolder: async (id: string, userId: string) => {
    log.info("FolderService.validateFolder: Validating folder", { id, userId });
    const folder = await FolderRepository.getIdAndUserId(id);

    if (!folder) {
      log.warn("FolderService.validateFolder: Folder not found", { id });
      throw APIError.notFound("Folder not found");
    }

    if (folder.userId !== userId) {
      log.warn("FolderService.validateFolder: Forbidden access", {
        id,
        userId,
      });
      throw APIError.permissionDenied("Forbidden");
    }

    log.info("FolderService.validateFolder: Folder validated", { id, userId });

    return folder;
  },

  create: async (data: FolderCreateDTO & { userId: string }) => {
    log.info("FolderService.create: Creating folder", { data });

    const createdFolder = await FolderRepository.create(data);

    if (!createdFolder) {
      log.warn("FolderService.create: Failed to create folder", { data });
      throw APIError.internal("Failed to create folder");
    }

    log.info("FolderService.create: Folder created", {
      folderId: createdFolder.id,
    });

    return createdFolder;
  },

  update: async (id: string, data: FolderUpdateDTO, userId: string) => {
    log.info("FolderService.update: Updating folder", { id, data, userId });
    await FolderService.validateFolder(id, userId);

    const updatedFolder = await FolderRepository.update(id, data, userId);

    if (!updatedFolder) {
      log.warn("FolderService.update: Failed to update folder", { id, userId });
      throw APIError.internal("Failed to update folder");
    }

    log.info("FolderService.update: Folder updated", { id, userId });
    return updatedFolder;
  },

  delete: async (id: string, userId: string) => {
    log.info("FolderService.delete: Deleting folder", { id, userId });
    await FolderService.validateFolder(id, userId);

    const deletedFolder = await FolderRepository.delete(id, userId);

    if (!deletedFolder) {
      log.warn("FolderService.delete: Failed to delete folder", { id, userId });
      throw APIError.internal("Failed to delete folder");
    }

    log.info("FolderService.delete: Folder deleted", { id, userId });
    return deletedFolder;
  },
};

export default FolderService;
