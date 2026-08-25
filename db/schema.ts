import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const appSettings = sqliteTable("app_settings", {
  id: integer("id").primaryKey(),
  encryptedApiKey: text("encrypted_api_key"),
  model: text("model").notNull().default("gpt-5.6"),
  officialQrData: text("official_qr_data"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const reports = sqliteTable("reports", {
  id: text("id").primaryKey(),
  prompt: text("prompt").notNull(),
  category: text("category").notNull(),
  title: text("title").notNull(),
  reportJson: text("report_json").notNull(),
  userId: text("user_id"),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const generationJobs = sqliteTable("generation_jobs", {
  rootId: text("root_id").primaryKey(),
  activeResponseId: text("active_response_id").notNull(),
  prompt: text("prompt").notNull(),
  model: text("model").notNull(),
  continuationCount: integer("continuation_count").notNull().default(0),
  status: text("status").notNull().default("queued"),
  userId: text("user_id"),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  username: text("username").notNull().unique(),
  displayName: text("display_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("member"),
  active: integer("active").notNull().default(1),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const authSessions = sqliteTable("auth_sessions", {
  tokenHash: text("token_hash").primaryKey(),
  userId: text("user_id").notNull(),
  expiresAt: text("expires_at").notNull(),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});
