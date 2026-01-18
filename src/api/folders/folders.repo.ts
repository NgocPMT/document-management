import { folders } from "../../db/schema";
import { db } from "../../db/database";
import { and, eq, InferInsertModel, InferSelectModel } from "drizzle-orm";

export type Folder = InferSelectModel<typeof folders>;
export type FolderCreate = Omit<InferInsertModel<typeof folders>, "id">;
export type FolderUpdate = Partial<Omit<FolderCreate, "createdAt" | "userId">>;

const FolderRepository = {
  find: async (userId: string) => {
    const rows = await db
      .select()
      .from(folders)
      .where(eq(folders.userId, userId));
    return rows;
  },

  create: async (data: FolderCreate): Promise<Folder | null> => {
    const [createdFolder] = await db.insert(folders).values(data).returning();
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
    return updatedFolder;
  },

  delete: async (id: string, userId: string): Promise<Folder | null> => {
    const [deletedFolder] = await db
      .delete(folders)
      .where(and(eq(folders.id, id), eq(folders.userId, userId)))
      .returning();
    return deletedFolder;
  },
};

export default FolderRepository;
