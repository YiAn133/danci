import {
  bigint,
  integer,
  json,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { ADMIN_ROLES } from "../lib/roles";

/** 管理员账号表：同时保存系统管理员（super_admin）和普通管理员（admin）。 */
export const adminUsers = pgTable("admin_users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role", { enum: ADMIN_ROLES }).notNull().default("admin"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** 登录会话表：token 写入 HttpOnly Cookie，有效期 7 天。 */
export const adminSessions = pgTable("admin_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  token: text("token").notNull().unique(),
  adminId: uuid("admin_id")
    .notNull()
    .references(() => adminUsers.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const ADMIN_SESSION_TTL_DAYS = 7;

/**
 * words.content 保存的是词典导出的原始词条 JSON。结构由上游词典决定、
 * 不同词书之间可能有出入，所以这里只声明稳定出现的最外层字段。
 */
export type WordContent = {
  word?: {
    wordHead?: string;
    wordId?: string;
    content?: Record<string, unknown>;
  };
};

/**
 * 单词表：一行一个单词，content 保存词条全文（例句、短语、同近义词、音标等）。
 *
 * 注意列名是驼峰（wordRank / headWord / bookId），建表时加了双引号，
 * 所以 Postgres 里大小写敏感，Drizzle 这边必须传同名而不是 snake_case。
 */
export const words = pgTable("words", {
  // bigint 默认映射成 JS BigInt，会让 JSON 序列化报错；这里用 number 更实用。
  id: bigint("id", { mode: "number" })
    .primaryKey()
    .generatedByDefaultAsIdentity(),
  wordRank: integer("wordRank"),
  headWord: text("headWord"),
  content: json("content").$type<WordContent>(),
  bookId: text("bookId"),
});
