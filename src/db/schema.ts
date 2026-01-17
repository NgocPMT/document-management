import { relations } from "drizzle-orm";
import * as p from "drizzle-orm/pg-core";

export const user = p.pgTable("user", {
  id: p.text("id").primaryKey(),
  name: p.text("name").notNull(),
  email: p.text("email").notNull().unique(),
  emailVerified: p.boolean("emailVerified").notNull().default(false),
  image: p.text("image"),
  createdAt: p.timestamp("createdAt").notNull().defaultNow(),
  updatedAt: p.timestamp("updatedAt").notNull().defaultNow(),
});

export const userRelations = relations(user, ({ many }) => ({
  folders: many(folders),
}));

export const session = p.pgTable("session", {
  id: p.text("id").primaryKey(),
  expiresAt: p.timestamp("expires_at").notNull(),
  token: p.text("token").notNull().unique(),
  createdAt: p.timestamp("created_at").notNull().defaultNow(),
  updatedAt: p.timestamp("updated_at").notNull().defaultNow(),
  ipAddress: p.text("ip_address"),
  userAgent: p.text("user_agent"),
  userId: p
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = p.pgTable("account", {
  id: p.text("id").primaryKey(),
  accountId: p.text("account_id").notNull(),
  providerId: p.text("provider_id").notNull(),
  userId: p
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: p.text("access_token"),
  refreshToken: p.text("refresh_token"),
  idToken: p.text("idToken"),
  accessTokenExpiresAt: p.timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: p.timestamp("refresh_token_expires_at"),
  scope: p.text("scope"),
  password: p.text("password"),
  createdAt: p.timestamp("created_at").notNull().defaultNow(),
  updatedAt: p.timestamp("updated_at").notNull().defaultNow(),
});

export const verification = p.pgTable("verification", {
  id: p.text("id").primaryKey(),
  identifier: p.text("identifier").notNull(),
  value: p.text("value").notNull(),
  expiresAt: p.timestamp("expires_at").notNull(),
  createdAt: p.timestamp("created_at"),
  updatedAt: p.timestamp("updated_at"),
});

export const folders = p.pgTable("folders", {
  id: p.uuid("id").defaultRandom().primaryKey(),
  name: p.text("name"),
  createdAt: p.timestamp("created_at").notNull().defaultNow(),
  userId: p
    .text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const foldersRelations = relations(folders, ({ one }) => ({
  user: one(user, {
    fields: [folders.userId],
    references: [user.id],
  }),
}));
