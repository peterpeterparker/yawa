import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { __createDbInstanceForTest__, DbInstance, DbAccessTokens } from "yawa-db";
import type { ApiEnv } from "../../src/types/api";
import { defineListTokens, defineDisableToken } from "../../src/internal/_tokens";

let instance: DbInstance;

const makeApp = (instance: DbInstance) => {
  const app = new Hono<ApiEnv>();

  app.use("*", async (c, next) => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error("DB connect failed");
    c.set("db", { connection: connectionResult.result });
    await next();
  });

  app.get("/tokens", defineListTokens);
  app.patch("/tokens/:id", defineDisableToken);

  return app;
};

describe("defineListTokens", () => {
  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();
  });

  afterEach(async () => {
    await instance.close();
  });

  test("returns empty list when no tokens", async () => {
    const app = makeApp(instance);
    const res = await app.request("/tokens");

    expect(res.status).toBe(200);
    const body = (await res.json()) as { tokens: unknown[] };
    expect(body.tokens).toHaveLength(0);
  });

  test("returns tokens without token_hash", async () => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();

    await DbAccessTokens.create({ connection: connectionResult.result }).insert({
      name: "claude.ai",
      token_hash: "abc123",
      expires_at: null,
    });

    const app = makeApp(instance);
    const res = await app.request("/tokens");

    expect(res.status).toBe(200);
    const body = (await res.json()) as { tokens: { name: string }[] };
    expect(body.tokens).toHaveLength(1);
    expect(body.tokens[0]?.name).toBe("claude.ai");
    expect(body.tokens[0]).not.toHaveProperty("token_hash");
  });
});

describe("defineDisableToken", () => {
  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();
  });

  afterEach(async () => {
    await instance.close();
  });

  test("returns 204 on success", async () => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();

    const insertResult = await DbAccessTokens.create({
      connection: connectionResult.result,
    }).insert({
      name: "claude.ai",
      token_hash: "abc123",
      expires_at: null,
    });
    expect(insertResult.status).toBe("success");

    const findResult = await DbAccessTokens.create({
      connection: connectionResult.result,
    }).findAll();
    if (findResult.status === "error") throw new Error();

    const { id } = findResult.result[0]!;

    const app = makeApp(instance);
    const res = await app.request(`/tokens/${id}`, { method: "PATCH" });

    expect(res.status).toBe(204);
  });

  test("disabled token can no longer be used", async () => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();

    const tokens = DbAccessTokens.create({ connection: connectionResult.result });
    await tokens.insert({ name: "claude.ai", token_hash: "abc123", expires_at: null });

    const findResult = await tokens.findAll();
    if (findResult.status === "error") throw new Error();

    const { id } = findResult.result[0]!;

    const app = makeApp(instance);
    await app.request(`/tokens/${id}`, { method: "PATCH" });

    const validResult = await tokens.findValidByHash({ token_hash: "abc123" });
    if (validResult.status === "error") throw new Error();

    expect(validResult.result).toBeUndefined();
  });
});
