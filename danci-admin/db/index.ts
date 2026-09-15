import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("缺少 DATABASE_URL 环境变量，请检查项目根目录的 .env 文件");
}

// Supabase 的连接池（pgbouncer，端口 6543）不支持预处理语句，所以关掉 prepare；
// 如果你用的是直连或 Session 模式（端口 5432），可以去掉这个选项。
const globalForDb = globalThis as unknown as {
  postgresClient?: ReturnType<typeof postgres>;
};

const client =
  globalForDb.postgresClient ?? postgres(connectionString, { prepare: false });

// 开发环境 Next.js 会热重载模块，缓存客户端避免反复创建连接池。
if (process.env.NODE_ENV !== "production") {
  globalForDb.postgresClient = client;
}

export const db = drizzle(client, { schema });
