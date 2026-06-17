import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { __createDbInstanceForTest__, DbInstance, DbSites, DbTrackEvents } from "yawa-db";
import { DbTrackEventsAnalytics } from "../../../src/queries/analytics/track-events";

describe("DbTrackEventsAnalytics", () => {
  const from = "2026-01-01T00:00:00.000Z";
  const to = "2026-12-31T23:59:59.000Z";

  let instance: DbInstance;
  let queries: DbTrackEventsAnalytics;
  let siteId: string;

  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();

    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    const { result: connection } = connectionResult;
    queries = DbTrackEventsAnalytics.create({ connection });

    const siteResult = await DbSites.create({ connection }).insert({ hostname: "example.com" });
    if (siteResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }
    siteId = siteResult.result.id;

    const events = DbTrackEvents.create({ connection });
    const sessionA = Bun.randomUUIDv7();
    const sessionB = Bun.randomUUIDv7();

    await events.insert({
      site_id: siteId,
      session_id: sessionA,
      visit_id: Bun.randomUUIDv7(),
      name: "button_click",
      metadata: null,
    });
    await events.insert({
      site_id: siteId,
      session_id: sessionA,
      visit_id: Bun.randomUUIDv7(),
      name: "button_click",
      metadata: null,
    });
    await events.insert({
      site_id: siteId,
      session_id: sessionB,
      visit_id: Bun.randomUUIDv7(),
      name: "button_click",
      metadata: null,
    });
    await events.insert({
      site_id: siteId,
      session_id: sessionA,
      visit_id: Bun.randomUUIDv7(),
      name: "form_submit",
      metadata: null,
    });
  });

  afterEach(async () => {
    await instance.close();
  });

  describe("getTopEvents", () => {
    test("returns events ranked by count", async () => {
      const result = await queries.getTopEvents({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result[0]?.name).toBe("button_click");
      expect(result.result[0]?.count).toBe(3);
      expect(result.result[1]?.name).toBe("form_submit");
      expect(result.result[1]?.count).toBe(1);
    });

    test("returns unique visitor count", async () => {
      const result = await queries.getTopEvents({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result[0]?.visitors).toBe(2);
    });

    test("respects limit", async () => {
      const result = await queries.getTopEvents({ site_id: siteId, from, to, limit: 1 });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toHaveLength(1);
      expect(result.result[0]?.name).toBe("button_click");
    });

    test("returns empty when no events", async () => {
      const connectionResult = await instance.connect();
      if (connectionResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      await connectionResult.result.run({
        sql: "DELETE FROM yawa_analytics.track_events",
        values: {},
      });

      const result = await queries.getTopEvents({ site_id: siteId, from, to });
      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }
      expect(result.result).toHaveLength(0);
    });
  });

  describe("getEventSeries", () => {
    test("returns daily event counts", async () => {
      const result = await queries.getEventSeries({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(Array.isArray(result.result)).toBe(true);
      expect(result.result.length).toBeGreaterThan(0);
      expect(result.result[0]).toHaveProperty("date");
      expect(result.result[0]).toHaveProperty("name");
      expect(result.result[0]).toHaveProperty("count");
    });

    test("groups by event name within same day", async () => {
      const result = await queries.getEventSeries({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const buttonClicks = result.result.find((r) => r.name === "button_click");
      const formSubmits = result.result.find((r) => r.name === "form_submit");

      expect(buttonClicks?.count).toBe(3);
      expect(formSubmits?.count).toBe(1);
    });
  });
});
