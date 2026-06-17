import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { __createDbInstanceForTest__, DbInstance, DbSites } from "yawa-db";
import { zValidator } from "@hono/zod-validator";
import { AppSchema } from "yawa-schema/app";
import * as z from "zod";
import type { AnalyticsSessionApiEnv } from "../../src/app/types/api.ts";
import { defineCreatePageView } from "../../src/app/_page-views";

const makeApp = (instance: DbInstance, siteId: string) => {
  const app = new Hono<AnalyticsSessionApiEnv>();

  app.use("*", async (c, next) => {
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error("DB connect failed");
    c.set("db", { connection: connectionResult.result });
    c.set("site", {
      id: siteId,
      hostname: "example.com",
      status: "active" as const,
      created_at: "2026-01-01 00:00:00",
      updated_at: "2026-01-01 00:00:00",
    });
    c.set("sessionId", "00000000-0000-7000-8000-000000000001");
    c.set("ip", "192.0.2.1");
    await next();
  });

  app.post(
    "/events/view",
    zValidator("json", AppSchema.Analytics.CreatePageViewRequestSchema),
    defineCreatePageView,
  );

  return app;
};

const validBody = {
  visit_id: "00000000-0000-7000-8000-000000000002",
  title: "Home",
  href: "https://example.com/",
  time_zone: "Europe/Zurich",
  device: { inner_width: 1920, inner_height: 1080 },
};

describe("defineCreatePageView", () => {
  let instance: DbInstance;
  let siteId: string;

  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error("DB connect failed");

    const siteResult = await DbSites.create({ connection: connectionResult.result }).insert({
      hostname: "example.com",
    });
    if (siteResult.status === "error") throw new Error("Site insert failed");
    siteId = siteResult.result.id;
  });

  afterEach(async () => {
    await instance.close();
  });

  test("returns 204 on success", async () => {
    const app = makeApp(instance, siteId);
    const res = await app.request("/events/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(204);
  });

  test("returns 400 for invalid href", async () => {
    const app = makeApp(instance, siteId);
    const res = await app.request("/events/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, href: "not-a-url" }),
    });
    expect(res.status).toBe(400);
  });

  test("strips query params and hash from href before storing", async () => {
    const app = makeApp(instance, siteId);
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();
    const connection = connectionResult.result;

    await app.request("/events/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validBody,
        href: "https://example.com/page?utm_source=twitter&ref=123#section",
      }),
    });

    const rows = await connection.query({
      sql: `SELECT href FROM yawa_analytics.page_views ORDER BY created_at DESC LIMIT 1`,
      schema: z.object({ href: z.string() }),
      values: {},
    });

    if (rows.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    expect(rows.result[0]?.href).toBe("https://example.com/page");
  });

  test("extracts referrer from Referer header", async () => {
    const app = makeApp(instance, siteId);
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();
    const connection = connectionResult.result;

    await app.request("/events/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Referer: "https://twitter.com",
      },
      body: JSON.stringify(validBody),
    });

    const rows = await connection.query({
      sql: `SELECT referrer FROM yawa_analytics.page_views ORDER BY created_at DESC LIMIT 1`,
      schema: z.object({ referrer: z.string().nullable() }),
      values: {},
    });

    if (rows.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    expect(rows.result[0]?.referrer).toBe("https://twitter.com");
  });

  test("extracts language from Accept-Language header", async () => {
    const app = makeApp(instance, siteId);
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();
    const connection = connectionResult.result;

    await app.request("/events/view", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": "fr-CH,fr;q=0.9,en;q=0.8",
      },
      body: JSON.stringify(validBody),
    });

    const rows = await connection.query({
      sql: `SELECT language FROM yawa_analytics.page_views ORDER BY created_at DESC LIMIT 1`,
      schema: z.object({ language: z.string().nullable() }),
      values: {},
    });

    if (rows.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    expect(rows.result[0]?.language).toBe("fr-CH");
  });

  test("extracts UTM campaign params from href", async () => {
    const app = makeApp(instance, siteId);
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();
    const connection = connectionResult.result;

    await app.request("/events/view", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...validBody,
        href: "https://example.com/?utm_source=twitter&utm_medium=social&utm_campaign=launch",
      }),
    });

    const rows = await connection.query({
      sql: `SELECT campaign_utm_source, campaign_utm_medium, campaign_utm_campaign FROM yawa_analytics.page_views ORDER BY created_at DESC LIMIT 1`,
      schema: z.object({
        campaign_utm_source: z.string().nullable(),
        campaign_utm_medium: z.string().nullable(),
        campaign_utm_campaign: z.string().nullable(),
      }),
      values: {},
    });

    if (rows.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    expect(rows.result[0]?.campaign_utm_source).toBe("twitter");
    expect(rows.result[0]?.campaign_utm_medium).toBe("social");
    expect(rows.result[0]?.campaign_utm_campaign).toBe("launch");
  });
});
