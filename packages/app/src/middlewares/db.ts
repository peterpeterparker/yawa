import { createMiddleware } from "hono/factory";
import type { DbInstance } from "yawa-db";

import type { ApiEnv } from "../types/api";

export const loadDbMiddleware = ({ db }: { db: DbInstance }) =>
  createMiddleware<ApiEnv>(async (context, next) => {
    const connectionResult = await db.connect();

    if (connectionResult.status === "error") {
      console.error(connectionResult.err);
      return context.json({ error: "Failed to connect to DB" }, 500);
    }

    const { result: connection } = connectionResult;

    context.set("db", { connection });

    await next();
  });
