import { eq, InferInsertModel } from "drizzle-orm";
import { db } from "../../db/database";
import { documents } from "../../db/schema";

type CreateDocument = InferInsertModel<typeof documents>;

const DocumentRepository = {
  create: async (data: CreateDocument) => {
    await db.insert(documents).values(data);
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
