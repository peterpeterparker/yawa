import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { __createDbInstanceForTest__, DbInstance, DbSites } from "yawa-db";
import { DbPerformanceMetricsAnalytics } from "../../../src/queries/analytics/performance-metrics";
import { DbPerformanceMetrics } from "../../../src/queries/transactions/performance-metrics";

describe("DbPerformanceMetricsAnalytics", () => {
  const from = "2026-01-01T00:00:00.000Z";
  const to = "2026-12-31T23:59:59.000Z";

  let instance: DbInstance;
  let queries: DbPerformanceMetricsAnalytics;
  let siteId: string;

  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();

    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    const { result: connection } = connectionResult;
    queries = DbPerformanceMetricsAnalytics.create({ connection });

    const siteResult = await DbSites.create({ connection }).insert({ hostname: "example.com" });
    if (siteResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    siteId = siteResult.result.id;

    const metrics = DbPerformanceMetrics.create({ connection });

    await metrics.insert({
      site_id: siteId,
      session_id: Bun.randomUUIDv7(),
      visit_id: Bun.randomUUIDv7(),
      href: "https://example.com/",
      metric_name: "LCP",
      value: 1200,
      delta: 1200,
      metric_id: "v3-1",
      navigation_type: "navigate",
    });
    await metrics.insert({
      site_id: siteId,
      session_id: Bun.randomUUIDv7(),
      visit_id: Bun.randomUUIDv7(),
      href: "https://example.com/",
      metric_name: "LCP",
      value: 3000,
      delta: 3000,
      metric_id: "v3-2",
      navigation_type: "navigate",
    });
    await metrics.insert({
      site_id: siteId,
      session_id: Bun.randomUUIDv7(),
      visit_id: Bun.randomUUIDv7(),
      href: "https://example.com/about",
      metric_name: "LCP",
      value: 5000,
      delta: 5000,
      metric_id: "v3-3",
      navigation_type: "navigate",
    });
    await metrics.insert({
      site_id: siteId,
      session_id: Bun.randomUUIDv7(),
      visit_id: Bun.randomUUIDv7(),
      href: "https://example.com/",
      metric_name: "CLS",
      value: 0.05,
      delta: 0.05,
      metric_id: "v3-4",
      navigation_type: null,
    });
    await metrics.insert({
      site_id: siteId,
      session_id: Bun.randomUUIDv7(),
      visit_id: Bun.randomUUIDv7(),
      href: "https://example.com/",
      metric_name: "CLS",
      value: 0.3,
      delta: 0.3,
      metric_id: "v3-5",
      navigation_type: null,
    });
  });

  afterEach(async () => {
    await instance.close();
  });

  describe("getWebVitalsSummary", () => {
    test("returns summary per metric name", async () => {
      const result = await queries.getWebVitalsSummary({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(Array.isArray(result.result)).toBe(true);
      const lcp = result.result.find((r) => r.metric_name === "LCP");
      expect(lcp).toBeDefined();
      expect(lcp?.count).toBe(3);
      expect(lcp?.avg).toBeGreaterThan(0);
      expect(lcp?.p75).toBeGreaterThan(0);
      expect(lcp?.p90).toBeGreaterThan(0);
    });

    test("returns all inserted metric types", async () => {
      const result = await queries.getWebVitalsSummary({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const names = result.result.map((r) => r.metric_name);
      expect(names).toContain("LCP");
      expect(names).toContain("CLS");
    });
  });

  describe("getWebVitalsByPage", () => {
    test("returns per-page breakdown for a metric", async () => {
      const result = await queries.getWebVitalsByPage({
        site_id: siteId,
        from,
        to,
        metric_name: "LCP",
      });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result.length).toBe(2);
      expect(result.result[0]).toHaveProperty("href");
      expect(result.result[0]).toHaveProperty("p75");
    });

    test("ranks by p75 descending", async () => {
      const result = await queries.getWebVitalsByPage({
        site_id: siteId,
        from,
        to,
        metric_name: "LCP",
      });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result[0]?.href).toBe("https://example.com/about");
    });
  });

  describe("getWebVitalsDistribution", () => {
    test("returns good/needs_improvement/poor buckets", async () => {
      const result = await queries.getWebVitalsDistribution({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const lcp = result.result.find((r) => r.metric_name === "LCP");
      expect(lcp?.good).toBe(1);
      expect(lcp?.needs_improvement).toBe(1);
      expect(lcp?.poor).toBe(1);
      expect(lcp?.total).toBe(3);
    });

    test("CLS distribution is correct", async () => {
      const result = await queries.getWebVitalsDistribution({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const cls = result.result.find((r) => r.metric_name === "CLS");
      expect(cls?.good).toBe(1);
      expect(cls?.poor).toBe(1);
      expect(cls?.total).toBe(2);
    });
  });
});
