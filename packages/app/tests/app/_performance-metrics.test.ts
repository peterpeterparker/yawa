import { describe, expect, test, beforeEach, afterEach } from "bun:test";
import { Hono } from "hono";
import { __createDbInstanceForTest__, DbInstance, DbSites } from "yawa-db";
import { zValidator } from "@hono/zod-validator";
import { AppSchema } from "yawa-schema/app";
import * as z from "zod";
import type { AnalyticsSessionApiEnv } from "../../src/app/types/api";
import { defineCreatePerformanceMetric } from "../../src/app/_performance-metrics";

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
    "/events/metric",
    zValidator("json", AppSchema.Analytics.CreatePerformanceMetricRequestSchema),
    defineCreatePerformanceMetric,
  );

  return app;
};

const validBody = {
  visit_id: "00000000-0000-7000-8000-000000000002",
  href: "https://example.com/",
  metric_name: "LCP" as const,
  value: 1234.56,
  delta: 100.0,
  metric_id: "v3-1234567890-1",
};

describe("defineCreatePerformanceMetric", () => {
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
    const res = await app.request("/events/metric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });
    expect(res.status).toBe(204);
  });

  test("stores metric correctly", async () => {
    const app = makeApp(instance, siteId);
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();
    const connection = connectionResult.result;

    await app.request("/events/metric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });

    const rows = await connection.query({
      sql: `SELECT metric_name::VARCHAR AS metric_name, value, delta, metric_id FROM yawa_analytics.performance_metrics ORDER BY created_at DESC LIMIT 1`,
      schema: z.object({
        metric_name: z.string(),
        value: z.coerce.number(),
        delta: z.coerce.number(),
        metric_id: z.string(),
      }),
      values: {},
    });

    if (rows.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    expect(rows.result[0]?.metric_name).toBe("LCP");
    expect(rows.result[0]?.value).toBe(1234.56);
    expect(rows.result[0]?.metric_id).toBe("v3-1234567890-1");
  });

  test("stores navigation_type when provided", async () => {
    const app = makeApp(instance, siteId);
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();
    const connection = connectionResult.result;

    await app.request("/events/metric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...validBody, navigation_type: "navigate" }),
    });

    const rows = await connection.query({
      sql: `SELECT navigation_type::VARCHAR AS navigation_type FROM yawa_analytics.performance_metrics ORDER BY created_at DESC LIMIT 1`,
      schema: z.object({ navigation_type: z.string().nullable() }),
      values: {},
    });

    if (rows.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    expect(rows.result[0]?.navigation_type).toBe("navigate");
  });

  test("stores null navigation_type when not provided", async () => {
    const app = makeApp(instance, siteId);
    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") throw new Error();
    const connection = connectionResult.result;

    await app.request("/events/metric", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validBody),
    });

    const rows = await connection.query({
      sql: `SELECT navigation_type FROM yawa_analytics.performance_metrics ORDER BY created_at DESC LIMIT 1`,
      schema: z.object({ navigation_type: z.string().nullable() }),
      values: {},
    });

    if (rows.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    expect(rows.result[0]?.navigation_type).toBeNull();
  });

  test("accepts all metric names", async () => {
    const app = makeApp(instance, siteId);
    const metrics = ["CLS", "FCP", "INP", "LCP", "TTFB"] as const;

    for (const metric_name of metrics) {
      const res = await app.request("/events/metric", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...validBody, metric_name }),
      });
      expect(res.status).toBe(204);
    }
  });
});
