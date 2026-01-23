import { folders } from "../../db/schema";
import { db } from "../../db/database";
import { and, eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { cache } from "../../cache/keyv";

export type Folder = InferSelectModel<typeof folders>;
export type FolderCreate = Omit<InferInsertModel<typeof folders>, "id">;
export type FolderUpdate = Partial<Omit<FolderCreate, "createdAt" | "userId">>;

const FOLDER_LIST_TTL = 5 * 60_000; // 5 minutes

const FolderRepository = {
  find: async (userId: string) => {
    const cacheKey = `user:${userId}-folder:all`;
    const cached = await cache.get<Folder[]>(cacheKey);
    if (cached) return cached;

    const rows = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId));

    await cache.set(cacheKey, rows, FOLDER_LIST_TTL);
    return rows;
  },

  getIdAndUserId: async (
    id: string,
  ): Promise<{ id: string; userId: string } | null> => {
    const [folder] = await db
      .select({ id: folders.id, userId: folders.userId })
      .from(folders)
      .where(eq(folders.id, id));
    return folder ?? null;
  },

  create: async (data: FolderCreate): Promise<Folder | null> => {
    const [createdFolder] = await db.insert(folders).values(data).returning();

    await cache.delete(`user:${createdFolder.userId}-folder:all`);
    return createdFolder;
  },

  update: async (
    id: string,
    data: FolderUpdate,
    userId: string,
  ): Promise<Folder | null> => {
    const [updatedFolder] = await db
      .update(folders)
      .set(data)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();

    await cache.delete(`user:${updatedFolder.userId}-folder:all`);
    return updatedFolder;
  },

  delete: async (id: string, userId: string): Promise<Folder | null> => {
    const [deletedFolder] = await db
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();
    await cache.delete(`user:${deletedFolder.userId}-folder:all`);
    return deletedFolder;
  },
};

export default FolderRepository;
