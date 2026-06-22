import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { __createDbInstanceForTest__, DbInstance } from "yawa-db";
import { loadDbMiddleware } from "../../src/middlewares/db";
import type { ApiEnv } from "../../src/types/api";

const makeApp = (db: DbInstance) => {
  const app = new Hono<ApiEnv>();
  app.use("*", loadDbMiddleware({ db }));
  app.get("/test", (c) => c.json({ ok: true }));
  return app;
};

describe("loadDbMiddleware", () => {
  test("sets db connection in context", async () => {
    const instance = await __createDbInstanceForTest__();
    const app = makeApp(instance);
    const res = await app.request("/test");
    expect(res.status).toBe(200);
    await instance.close();
  });
});
