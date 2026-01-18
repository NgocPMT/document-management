import { eq, InferInsertModel, InferSelectModel } from "drizzle-orm";
import { db } from "../../db/database";
import { documents } from "../../db/schema";

type Document = InferSelectModel<typeof documents>;
type CreateDocument = InferInsertModel<typeof documents>;
type UpdateDocument = Partial<Omit<CreateDocument, "userId" | "createdAt">>;

const DocumentRepository = {
  findByUser: async (userId: string): Promise<Document[]> => {
    const rows = await db
      .select()
      .from(documents)
      .where(eq(documents.userId, userId));
    return rows;
  },
  findOne: async (id: string): Promise<Document | null> => {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  },
  create: async (data: CreateDocument): Promise<Document | null> => {
    const [createdDocument] = await db
      .insert(documents)
      .values(data)
      .returning();
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
    return updatedDocument;
  },
  delete: async (id: string): Promise<Document | null> => {
    const [deletedDocument] = await db
      .delete(documents)
      .where(eq(documents.id, id))
      .returning();
    return deletedDocument;
  },
  getObjectKey: async (id: string) => {
    const [document] = await db
      .select({
        key: documents.name,
      })
      .from(documents)
      .where(eq(documents.id, id))
      .limit(1);

    return document ? document.key : null;
  },
};

export default DocumentRepository;
