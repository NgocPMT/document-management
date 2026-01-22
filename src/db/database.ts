import { SQLDatabase } from "encore.dev/storage/sqldb";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";
import { Pool } from "pg";
import { DBOS } from "@dbos-inc/dbos-sdk";

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

let dbosLaunched = false;

async function launchDBOS() {
  if (dbosLaunched) return;
  dbosLaunched = true;

  process.env.DBOS_DATABASE_URL = DB.connectionString;
  process.env.DBOS_SYSTEM_DATABASE_URL = DB.connectionString;

  DBOS.setConfig({
    name: "document-management",
    systemDatabaseUrl: DB.connectionString,
  });

  await DBOS.launch();
}

launchDBOS().catch((err) => {
  console.error("Failed to launch DBOS", err);
  process.exit(1);
});
