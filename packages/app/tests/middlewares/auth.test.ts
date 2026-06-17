import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { __createDbInstanceForTest__, DbInstance, DbAccessTokens } from "yawa-db";
import { assertAuthMiddleware } from "../../src/middlewares/auth";
import type { ApiEnv } from "../../src/types/api.ts";

const makeApp = (db: DbInstance) => {
  const app = new Hono<ApiEnv>();
  app.use("*", async (c, next) => {
    const connectionResult = await db.connect();
    if (connectionResult.status === "error") throw new Error("DB connect failed");
    c.set("db", { connection: connectionResult.result });
    await next();
  });
  app.use("*", assertAuthMiddleware);
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
};

describe("assertAuthMiddleware", () => {
  let instance: DbInstance;
  let validToken: string;

  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();

    const bytes = crypto.getRandomValues(new Uint8Array(32));
    validToken = bytes.toBase64({ alphabet: "base64url" });
    const hash = new Bun.CryptoHasher("sha256").update(validToken).digest("hex");

    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();

    await DbAccessTokens.create({ connection: connectionResult.result }).insert({
      name: "test",
      token_hash: hash,
      expires_at: null,
    });
  });

  afterEach(async () => {
    await instance.close();
  });

  test("allows request with valid token", async () => {
    const app = makeApp(instance);
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${validToken}` },
    });
    expect(res.status).toBe(200);
  });

  test("returns 401 when no authorization header", async () => {
    const app = makeApp(instance);
    const res = await app.request("/test");
    expect(res.status).toBe(401);
  });

  test("returns 401 for invalid token", async () => {
    const app = makeApp(instance);
    const res = await app.request("/test", {
      headers: { authorization: "Bearer invalidtoken" },
    });
    expect(res.status).toBe(401);
  });

  test("returns 401 for expired token", async () => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();

    const bytes = crypto.getRandomValues(new Uint8Array(32));
    const expiredToken = bytes.toBase64({ alphabet: "base64url" });
    const hash = new Bun.CryptoHasher("sha256").update(expiredToken).digest("hex");

    await DbAccessTokens.create({ connection: connectionResult.result }).insert({
      name: "expired",
      token_hash: hash,
      expires_at: "2020-01-01",
    });

    const app = makeApp(instance);
    const res = await app.request("/test", {
      headers: { authorization: `Bearer ${expiredToken}` },
    });
    expect(res.status).toBe(401);
  });
});
