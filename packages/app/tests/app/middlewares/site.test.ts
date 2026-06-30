import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { __createDbInstanceForTest__, DbInstance } from "yawa-db";
import { DbSites, DbLinkedSites } from "yawa-db";
import { loadSiteMiddleware } from "../../../src/app/middlewares/site";
import type { AnalyticsApiEnv } from "../../../src/app/types/api";

const makeApp = (db: DbInstance) => {
  const app = new Hono<AnalyticsApiEnv>();
  app.use("*", async (c, next) => {
    const connectionResult = await db.connect();
    if (connectionResult.status === "error") throw new Error("DB connect failed");
    c.set("db", { connection: connectionResult.result });
    await next();
  });
  app.use("*", loadSiteMiddleware);
  app.get("/test", (c) => c.json({ hostname: c.get("site").hostname }));
  return app;
};

describe("loadSiteMiddleware", () => {
  let instance: DbInstance;

  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();

    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error("DB connect failed");

    await DbSites.create({ connection: connectionResult.result }).insert({
      hostname: "example.com",
    });
  });

  afterEach(async () => {
    await instance.close();
  });

  test("sets site in context for registered hostname", async () => {
    const app = makeApp(instance);
    const res = await app.request("/test", {
      headers: { origin: "https://example.com" },
    });
    expect(res.status).toBe(200);
    const { hostname } = (await res.json()) as { hostname: string };
    expect(hostname).toBe("example.com");
  });

  test("sets site in context for registered additional hostname", async () => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error("DB connect failed");

    const sites = DbSites.create({ connection: connectionResult.result });
    const siteResult = await sites.findActiveByHostname({ hostname: "example.com" });

    if (siteResult.status === "error" || !siteResult.result) {
      throw new Error("Setup failed");
    }

    await DbLinkedSites.create({ connection: connectionResult.result }).insert({
      site_id: siteResult.result.id,
      hostname: "www.example.com",
    });

    const app = makeApp(instance);
    const res = await app.request("/test", {
      headers: { origin: "https://www.example.com" },
    });

    expect(res.status).toBe(200);
    const { hostname } = (await res.json()) as { hostname: string };
    expect(hostname).toBe("example.com");
  });

  test("returns 403 for unregistered hostname", async () => {
    const app = makeApp(instance);
    const res = await app.request("/test", {
      headers: { origin: "https://unknown.com" },
    });
    expect(res.status).toBe(403);
  });

  test("returns 403 when origin header is missing", async () => {
    const app = makeApp(instance);
    const res = await app.request("/test");
    expect(res.status).toBe(403);
  });

  test("returns 403 for invalid origin", async () => {
    const app = makeApp(instance);
    const res = await app.request("/test", {
      headers: { origin: "not-a-url" },
    });
    expect(res.status).toBe(403);
  });
});
