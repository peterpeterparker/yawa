import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { __createDbInstanceForTest__, DbInstance, DbSites } from "yawa-db";
import { DbPerformanceMetrics } from "../../../src/queries/transactions/performance-metrics";

describe("DbPerformanceMetrics", () => {
  let instance: DbInstance;
  let queries: DbPerformanceMetrics;
  let siteId: string;

  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();

    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    const { result: connection } = connectionResult;
    queries = DbPerformanceMetrics.create({ connection });

    const siteResult = await DbSites.create({ connection }).insert({ hostname: "example.com" });
    if (siteResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    siteId = siteResult.result.id;
  });

  afterEach(async () => {
    await instance.close();
  });

  describe("insert", () => {
    test("inserts a performance metric and returns its id", async () => {
      const result = await queries.insert({
        site_id: siteId,
        session_id: Bun.randomUUIDv7(),
        visit_id: Bun.randomUUIDv7(),
        href: "https://example.com/",
        metric_name: "LCP",
        value: 1234.56,
        delta: 100.0,
        metric_id: "v3-1234567890-1",
        navigation_type: "navigate",
      });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }
      expect(result.result.id).toBeDefined();
    });

    test("inserts a performance metric with null navigation_type", async () => {
      const result = await queries.insert({
        site_id: siteId,
        session_id: Bun.randomUUIDv7(),
        visit_id: Bun.randomUUIDv7(),
        href: "https://example.com/",
        metric_name: "CLS",
        value: 0.05,
        delta: 0.01,
        metric_id: "v3-9876543210-1",
        navigation_type: null,
      });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }
      expect(result.result.id).toBeDefined();
    });

    test("inserts all metric types", async () => {
      const metrics = ["CLS", "FCP", "INP", "LCP", "TTFB"] as const;

      for (const metric_name of metrics) {
        const result = await queries.insert({
          site_id: siteId,
          session_id: Bun.randomUUIDv7(),
          visit_id: Bun.randomUUIDv7(),
          href: "https://example.com/",
          metric_name,
          value: 100.0,
          delta: 10.0,
          metric_id: `v3-${metric_name}-1`,
          navigation_type: "navigate",
        });

        expect(result.status).toBe("success");
      }
    });

    test("fails for invalid site_id", async () => {
      const result = await queries.insert({
        site_id: "00000000-0000-7000-8000-000000000000",
        session_id: Bun.randomUUIDv7(),
        visit_id: Bun.randomUUIDv7(),
        href: "https://example.com/",
        metric_name: "LCP",
        value: 1234.56,
        delta: 100.0,
        metric_id: "v3-1234567890-1",
        navigation_type: null,
      });

      expect(result.status).toBe("error");
    });
  });
});
