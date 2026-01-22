import { SQLDatabase } from "encore.dev/storage/sqldb";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

const DB = new SQLDatabase("document-management", {
  migrations: {
    path: "migrations",
    source: "drizzle",
  },
});

export const db = drizzle(DB.connectionString, { schema });
