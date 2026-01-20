import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/database";
import { documents } from "../../db/schema";
import { cache } from "../../cache/keyv";

type Document = InferSelectModel<typeof documents>;
type CreateDocument = InferInsertModel<typeof documents>;
type UpdateDocument = Partial<Omit<CreateDocument, "userId" | "createdAt">>;

const DOCUMENT_TTL = 2 * 60_000; // 2 minutes
const DOCUMENT_LIST_TTL = 5 * 60_000; // 5 minutes
const STORAGE_KEY_TTL = 10 * 60_000; // 10 minutes

const DocumentRepository = {
  findByUser: async (userId: string): Promise<Document[]> => {
    const cacheKey = `user:${userId}-document:all`;
    const cached = await cache.get<Document[]>(cacheKey);
    if (cached) return cached;

    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId));

    await cache.set(cacheKey, rows, DOCUMENT_LIST_TTL);
    return rows;
  },
  findOne: async (id: string): Promise<Document | null> => {
    const cacheKey = `document:${id}`;
    const cached = await cache.get<Document | null>(cacheKey);
    if (cached !== undefined) return cached;

    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));

    const cacheValue = document ?? null;

    await cache.set(cacheKey, cacheValue, DOCUMENT_TTL);
    return document;
  },
  create: async (data: CreateDocument): Promise<Document | null> => {
    const [createdDocument] = await db
      .insert(documents)
      .values(data)
      .returning();

    await cache.delete(`user:${createdDocument.userId}-document:all`);
    return createdDocument;
  },
  update: async (
    id: string,
    data: UpdateDocument,
  ): Promise<Document | null> => {
    const [updatedDocument] = await db
      .update(documents)
      .set(data)
      .where(eq(documents.id, id))
      .returning();
    await cache.delete(`document:${id}`);
    await cache.delete(`document:${id}:storageKey`);
    await cache.delete(`user:${updatedDocument.userId}-document:all`);
    return updatedDocument;
  },
  delete: async (id: string): Promise<Document | null> => {
    const [deletedDocument] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();
    await cache.delete(`document:${id}`);
    await cache.delete(`document:${id}:storageKey`);
    await cache.delete(`user:${deletedDocument.userId}-document:all`);
    return deletedDocument;
  },
  getObjectKey: async (id: string): Promise<string | null> => {
    const cacheKey = `document:${id}:storageKey`;
    const cached = await cache.get<string | null>(cacheKey);
    if (cached !== undefined) return cached;

    const [document] = await db
      .select({
        key: documents.storageKey,
      })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    const cacheValue = document ?? null;
    await cache.set(cacheKey, cacheValue, STORAGE_KEY_TTL);
    return document ? document.key : null;
  },
};

export default DocumentRepository;
