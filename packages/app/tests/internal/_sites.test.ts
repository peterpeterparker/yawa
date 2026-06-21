import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { __createDbInstanceForTest__, DbInstance, DbSites } from "yawa-db";
import { zValidator } from "@hono/zod-validator";
import { InternalSchema } from "yawa-schema/app";
import type { ApiEnv } from "../../src/types/api";
import {
  defineCreateSite,
  defineListSites,
  defineUpdateSiteStatus,
} from "../../src/internal/_sites";

let instance: DbInstance;

const makeApp = (instance: DbInstance) => {
  const app = new Hono<ApiEnv>();

  app.use("*", async (c, next) => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error("DB connect failed");
    c.set("db", { connection: connectionResult.result });
    await next();
  });

  app.post(
    "/sites",
    zValidator("json", InternalSchema.Site.CreateSiteRequestSchema),
    defineCreateSite,
  );
  app.get("/sites", defineListSites);
  app.patch(
    "/sites/:id",
    zValidator("json", InternalSchema.Site.UpdateSiteStatusRequestSchema),
    defineUpdateSiteStatus,
  );

  return app;
};

describe("defineListSites", () => {
  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();
  });

  afterEach(async () => {
    await instance.close();
  });

  test("returns empty list when no sites", async () => {
    const app = makeApp(instance);
    const res = await app.request("/sites");

    expect(res.status).toBe(200);
    const body = (await res.json()) as { sites: unknown[] };
    expect(body.sites).toHaveLength(0);
  });

  test("returns all sites", async () => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();

    await DbSites.create({ connection: connectionResult.result }).insert({
      hostname: "example.com",
    });

    const app = makeApp(instance);
    const res = await app.request("/sites");

    expect(res.status).toBe(200);
    const body = (await res.json()) as { sites: { hostname: string }[] };
    expect(body.sites).toHaveLength(1);
    expect(body.sites[0]?.hostname).toBe("example.com");
  });
});

describe("defineUpdateSiteStatus", () => {
  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();
  });

  afterEach(async () => {
    await instance.close();
  });

  test("returns 204 on success", async () => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();

    const insertResult = await DbSites.create({ connection: connectionResult.result }).insert({
      hostname: "example.com",
    });
    if (insertResult.status === "error") throw new Error();

    const { id } = insertResult.result;

    const app = makeApp(instance);
    const res = await app.request(`/sites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "disabled" }),
    });

    expect(res.status).toBe(204);
  });

  test("updates the site status", async () => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();

    const sites = DbSites.create({ connection: connectionResult.result });
    const insertResult = await sites.insert({ hostname: "example.com" });
    if (insertResult.status === "error") throw new Error();

    const { id } = insertResult.result;

    const app = makeApp(instance);
    await app.request(`/sites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "disabled" }),
    });

    const findResult = await sites.findAll();
    if (findResult.status === "error") throw new Error();

    expect(findResult.result[0]?.status).toBe("disabled");
  });

  test("returns 400 for invalid status", async () => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();

    const insertResult = await DbSites.create({ connection: connectionResult.result }).insert({
      hostname: "example.com",
    });
    if (insertResult.status === "error") throw new Error();

    const { id } = insertResult.result;

    const app = makeApp(instance);
    const res = await app.request(`/sites/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "not-a-status" }),
    });

    expect(res.status).toBe(400);
  });
});
