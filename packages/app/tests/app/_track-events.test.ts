import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { __createDbInstanceForTest__, DbInstance, DbSites } from "yawa-db";
import { zValidator } from "@hono/zod-validator";
import { AppSchema } from "yawa-schema/app";
import * as z from "zod";
import type { AnalyticsSessionApiEnv } from "../../src/app/types/api";
import { defineCreateTrackEvent } from "../../src/app/_track-events";

let instance: DbInstance;
let siteId: string;

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
    "/events/track",
    zValidator("json", AppSchema.Analytics.CreateTrackEventRequestSchema),
    defineCreateTrackEvent,
  );

  return app;
};

describe("defineCreateTrackEvent", () => {
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
    const res = await app.request("/events/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visit_id: "00000000-0000-7000-8000-000000000002",
        name: "button_click",
      }),
    });
    expect(res.status).toBe(204);
  });

  test("stores event name correctly", async () => {
    const app = makeApp(instance, siteId);
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();
    const connection = connectionResult.result;

    await app.request("/events/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visit_id: "00000000-0000-7000-8000-000000000002",
        name: "form_submit",
      }),
    });

    const rows = await connection.query({
      sql: `SELECT name FROM yawa_analytics.track_events ORDER BY created_at DESC LIMIT 1`,
      schema: z.object({ name: z.string() }),
      values: {},
    });

    if (rows.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    expect(rows.result[0]?.name).toBe("form_submit");
  });

  test("stores metadata when provided", async () => {
    const app = makeApp(instance, siteId);
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();
    const connection = connectionResult.result;

    await app.request("/events/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visit_id: "00000000-0000-7000-8000-000000000002",
        name: "purchase",
        metadata: { plan: "pro", currency: "CHF" },
      }),
    });

    const rows = await connection.query({
      sql: `SELECT metadata FROM yawa_analytics.track_events ORDER BY created_at DESC LIMIT 1`,
      schema: z.object({ metadata: z.string().nullable() }),
      values: {},
    });

    if (rows.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    expect(rows.result[0]?.metadata).not.toBeNull();
  });

  test("stores null metadata when not provided", async () => {
    const app = makeApp(instance, siteId);
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();
    const connection = connectionResult.result;

    await app.request("/events/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        visit_id: "00000000-0000-7000-8000-000000000002",
        name: "button_click",
      }),
    });

    const rows = await connection.query({
      sql: `SELECT metadata FROM yawa_analytics.track_events ORDER BY created_at DESC LIMIT 1`,
      schema: z.object({ metadata: z.string().nullable() }),
      values: {},
    });

    if (rows.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    expect(rows.result[0]?.metadata).toBeNull();
  });
});
