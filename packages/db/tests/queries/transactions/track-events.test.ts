import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { __createDbInstanceForTest__, DbInstance, DbSites } from "yawa-db";
import { DbTrackEvents } from "../../../src/queries/transactions/track-events";

describe("DbTrackEvents", () => {
  let instance: DbInstance;
  let queries: DbTrackEvents;
  let siteId: string;

  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();

    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    const { result: connection } = connectionResult;
    queries = DbTrackEvents.create({ connection });

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
    test("inserts a track event and returns its id", async () => {
      const result = await queries.insert({
        site_id: siteId,
        session_id: Bun.randomUUIDv7(),
        visit_id: Bun.randomUUIDv7(),
        name: "button_click",
        metadata: null,
      });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }
      expect(result.result.id).toBeDefined();
    });

    test("inserts a track event with metadata", async () => {
      const result = await queries.insert({
        site_id: siteId,
        session_id: Bun.randomUUIDv7(),
        visit_id: Bun.randomUUIDv7(),
        name: "purchase",
        metadata: { plan: "pro", currency: "CHF" },
      });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }
      expect(result.result.id).toBeDefined();
    });

    test("fails for invalid site_id", async () => {
      const result = await queries.insert({
        site_id: "00000000-0000-7000-8000-000000000000",
        session_id: Bun.randomUUIDv7(),
        visit_id: Bun.randomUUIDv7(),
        name: "button_click",
        metadata: null,
      });

      expect(result.status).toBe("error");
    });
  });
});
