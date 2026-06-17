import { DbAccessTokens } from "yawa-db";
import { createMiddleware } from "hono/factory";
import { hashToken } from "../internal/utils/token";
import { isNullish } from "yawa-common";
import type { ApiEnv } from "../types/api";

export const assertAuthMiddleware = createMiddleware<ApiEnv>(async (context, next) => {
  const {
    req,
    var: {
      db: { connection },
    },
  } = context;

  const authHeader = req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const token = authHeader.slice("Bearer ".length);
  const { hash } = hashToken({ token });

  const result = await DbAccessTokens.create({ connection }).findValidByHash({
    token_hash: hash,
  });

  // If the DB throws an error
  if (result.status === "error") {
    return context.json({ error: "Unauthorized" }, 401);
  }

  const { result: accessToken } = result;

  // If no valid token - expires_at not null and < now
  if (isNullish(accessToken)) {
    return context.json({ error: "Unauthorized" }, 401);
  }

  await next();
});
