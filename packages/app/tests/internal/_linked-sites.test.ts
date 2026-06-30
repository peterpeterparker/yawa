import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { __createDbInstanceForTest__, DbInstance, DbSites, DbLinkedSites } from "yawa-db";
import type { ApiEnv } from "../../src/types/api";
import { defineListLinkedSites } from "../../src/internal/_linked-sites";

let instance: DbInstance;

const makeApp = (instance: DbInstance) => {
  const app = new Hono<ApiEnv>();

  app.use("*", async (c, next) => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error("DB connect failed");
    c.set("db", { connection: connectionResult.result });
    await next();
  });

  app.get("/sites/linked", defineListLinkedSites);

  return app;
};

describe("defineListLinkedSites", () => {
  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();
  });

  afterEach(async () => {
    await instance.close();
  });

  test("returns empty list when no linked sites", async () => {
    const app = makeApp(instance);
    const res = await app.request("/sites/linked");

    expect(res.status).toBe(200);
    const body = (await res.json()) as { linkedSites: unknown[] };
    expect(body.linkedSites).toHaveLength(0);
  });

  test("returns all linked sites", async () => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();

    const sites = DbSites.create({ connection: connectionResult.result });
    const siteResult = await sites.insert({ hostname: "example.com" });
    if (siteResult.status === "error") throw new Error();

    const { id: site_id } = siteResult.result;

    await DbLinkedSites.create({ connection: connectionResult.result }).insert({
      site_id,
      hostname: "www.example.com",
    });

    const app = makeApp(instance);
    const res = await app.request("/sites/linked");

    expect(res.status).toBe(200);
    const body = (await res.json()) as { linkedSites: { hostname: string; site_id: string }[] };
    expect(body.linkedSites).toHaveLength(1);
    expect(body.linkedSites[0]?.hostname).toBe("www.example.com");
    expect(body.linkedSites[0]?.site_id).toBe(site_id);
  });
});
