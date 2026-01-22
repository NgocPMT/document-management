import {
  and,
  desc,
  eq,
  ilike,
  InferInsertModel,
  InferSelectModel,
} from "drizzle-orm";
import { db } from "../../db/database";
import { documents, documentShares } from "../../db/schema";
import { cache } from "../../cache/keyv";

type Document = InferSelectModel<typeof documents>;
type SharedDocument = InferSelectModel<typeof documentShares>;
type CreateShareDocument = InferInsertModel<typeof documentShares>;
type CreateDocument = InferInsertModel<typeof documents>;
type UpdateDocument = Partial<Omit<CreateDocument, "userId" | "createdAt">>;
type DocumentParams = {
  folderId?: string;
  limit: number;
  offset: number;
};

const DOCUMENT_TTL = 2 * 60_000; // 2 minutes
const DOCUMENT_LIST_TTL = 5 * 60_000; // 5 minutes
const STORAGE_KEY_TTL = 10 * 60_000; // 10 minutes

const getDocumentsCacheVersion = async (userId: string): Promise<Number> => {
  const key = `user:${userId}:documents:version`;
  return (await cache.get<number>(key)) ?? 1;
};

const bumpDocumentsCacheVersion = async (userId: string) => {
  const key = `user:${userId}:documents:version`;
  await cache.set(key, Date.now());
};

const getCacheKeyForFinding = async (
  userId: string,
  params: DocumentParams,
  search?: string,
) => {
  const version = await getDocumentsCacheVersion(userId);

  const { folderId, limit, offset } = params;

  return [
    "documents",
    "user",
    userId,
    `v${version}`,
    folderId ? `folder:${folderId}` : "folder:all",
    `limit:${limit}`,
    `offset:${offset}`,
    search ? `search:${search}` : undefined,
  ].join(":");
};

const DocumentRepository = {
  findByUser: async (
    userId: string,
    params: DocumentParams,
  ): Promise<Document[]> => {
    const cacheKey = await getCacheKeyForFinding(userId, params);
    const cached = await cache.get<Document[]>(cacheKey);
    if (cached) return cached;

    const cond = [];

    if (params.folderId) {
      cond.push(eq(documents.folderId, params.folderId));
    }

    const rows = await db
      .select()
      .from(documents)
      .where(and(...cond, eq(documents.userId, userId)))
      .orderBy(documents.createdAt, documents.id)
      .limit(params.limit)
      .offset(params.offset);

    await cache.set(cacheKey, rows, DOCUMENT_LIST_TTL);
    return rows;
  },
  findByName: async (
    search: string,
    userId: string,
    params: DocumentParams,
  ): Promise<Document[]> => {
    const cacheKey = await getCacheKeyForFinding(userId, params, search);
    const cached = await cache.get<Document[]>(cacheKey);
    if (cached) return cached;

    const cond = [];

    if (params.folderId) {
      cond.push(eq(documents.folderId, params.folderId));
    }

    const rows = await db
      .select()
      .from(documents)
      .where(
        and(
          ...cond,
          eq(documents.userId, userId),
          ilike(documents.name, `%${search}%`),
        ),
      )
      .orderBy(desc(documents.createdAt), documents.id)
      .limit(params.limit)
      .offset(params.offset);

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
  getIdAndUserId: async (id: string) => {
    const [document] = await db
      .select({ id: documents.id, userId: documents.userId })
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  },
  create: async (data: CreateDocument): Promise<Document | null> => {
    const [createdDocument] = await db
      .insert(documents)
      .values(data)
      .returning();

    await bumpDocumentsCacheVersion(createdDocument.userId);
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
    await bumpDocumentsCacheVersion(updatedDocument.userId);
    return updatedDocument;
  },
  delete: async (id: string): Promise<Document | null> => {
    const [deletedDocument] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();
    await cache.delete(`document:${id}`);
    await cache.delete(`document:${id}:storageKey`);
    await bumpDocumentsCacheVersion(deletedDocument.userId);
    return deletedDocument;
  },
  createSharedDocument: async (
    data: CreateShareDocument,
  ): Promise<SharedDocument> => {
    const [sharedDocument] = await db
      .insert(documentShares)
      .values(data)
      .returning();
    return sharedDocument;
  },
  findSharedDocument: async (
    documentId: string,
    userId: string,
  ): Promise<SharedDocument | null> => {
    const [sharedDocument] = await db
      .select()
      .from(documentShares)
      .where(
        and(
          eq(documentShares.documentId, documentId),
          eq(documentShares.userId, userId),
        ),
      )
      .orderBy(desc(documentShares.expiresAt))
      .limit(1);
    return sharedDocument ?? null;
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
