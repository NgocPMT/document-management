import { api } from "encore.dev/api";
import FolderService from "./folders.service";
import { FolderCreateDTO, FolderUpdateDTO } from "./folders.inferface";
import { getAuthData } from "~encore/auth";

export const get = api(
  {
    expose: true,
    auth: true,
    method: "GET",
    path: "/v1/folders",
  },
  async () => {
    const authData = getAuthData();
    return FolderService.get(authData.userID);
  },
);

export const create = api(
  {
    expose: true,
    auth: true,
    method: "POST",
    path: "/v1/folders",
  },
  async (data: FolderCreateDTO) => {
    const authData = getAuthData();
    return FolderService.create({
      ...data,
      userId: authData.userID,
    });
  },
);

export const update = api(
  {
    expose: true,
    auth: true,
    method: "PUT",
    path: "/v1/folders/:id",
  },
  async ({ id, body }: { id: string; body: FolderUpdateDTO }) => {
    const authData = getAuthData();
    return FolderService.update(id, body, authData.userID);
  },
);

export const destroy = api(
  {
    expose: true,
    auth: true,
    method: "DELETE",
    path: "/v1/folders/:id",
  },
  async ({ id }: { id: string }) => {
    const authData = getAuthData();
    return FolderService.delete(id, authData.userID);
  },
);
