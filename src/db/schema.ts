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

export const session = p.pgTable("session", {
  id: p.text("id").primaryKey(),
  expiresAt: p.timestamp("expiresAt").notNull(),
  token: p.text("token").notNull().unique(),
  createdAt: p.timestamp("createdAt").notNull().defaultNow(),
  updatedAt: p.timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: p.text("ipAddress"),
  userAgent: p.text("userAgent"),
  userId: p
    .text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = p.pgTable("account", {
  id: p.text("id").primaryKey(),
  accountId: p.text("accountId").notNull(),
  providerId: p.text("providerId").notNull(),
  userId: p
    .text("userId")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: p.text("accessToken"),
  refreshToken: p.text("refreshToken"),
  idToken: p.text("idToken"),
  accessTokenExpiresAt: p.timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: p.timestamp("refreshTokenExpiresAt"),
  scope: p.text("scope"),
  password: p.text("password"),
  createdAt: p.timestamp("createdAt").notNull().defaultNow(),
  updatedAt: p.timestamp("updatedAt").notNull().defaultNow(),
});

export const verification = p.pgTable("verification", {
  id: p.text("id").primaryKey(),
  identifier: p.text("identifier").notNull(),
  value: p.text("value").notNull(),
  expiresAt: p.timestamp("expiresAt").notNull(),
  createdAt: p.timestamp("createdAt"),
  updatedAt: p.timestamp("updatedAt"),
});
