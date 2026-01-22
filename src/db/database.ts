import { SQLDatabase } from "encore.dev/storage/sqldb";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg";

const DB = new SQLDatabase("document-management", {
  migrations: {
    path: "migrations",
    source: "drizzle",
  },
});

const pool = new Pool({
  connectionString: DB.connectionString,
  max: 15,
  min: 2,
  idleTimeoutMillis: 30_000, // 30 Seconds,
  connectionTimeoutMillis: 2_000, // 2 Seconds
  keepAlive: true,
});

export const db = drizzle(pool, { schema });
