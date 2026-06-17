import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { DbInstance } from "../../../src";
import { DbPageViews } from "../../../src/queries/transactions/page-views";
import { DbSites } from "../../../src/queries/transactions/sites";
import { migrate } from "../../../src/migrate";

describe("DbPageViews", () => {
  let instance: DbInstance;
  let queries: DbPageViews;
  let siteId: string;

  beforeEach(async () => {
    instance = await DbInstance.create({ type: "in-memory" });
    await migrate({ instance });

    const connectionResult = await instance.connect();

    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    const { result: connection } = connectionResult;

    queries = DbPageViews.create({ connection });

    const siteResult = await DbSites.create({ connection }).insert({
      hostname: "example.com",
    });

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
    test("inserts a page view and returns its id", async () => {
      const result = await queries.insert({
        site_id: siteId,
        session_id: Bun.randomUUIDv7(),
        visit_id: Bun.randomUUIDv7(),
        title: "Home",
        href: "https://example.com/",
        referrer: null,
        time_zone: "Europe/Zurich",
        user_agent: "Mozilla/5.0",
        language: "en-US",
        device_inner_width: 1920,
        device_inner_height: 1080,
        device_screen_width: 1920,
        device_screen_height: 1080,
        client_browser: "Chrome",
        client_operating_system: "macOS",
        client_device: "desktop",
        campaign_utm_source: null,
        campaign_utm_medium: null,
        campaign_utm_campaign: null,
        campaign_utm_term: null,
        campaign_utm_content: null,
      });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.id).toBeDefined();
    });

    test("inserts a page view with nullable fields as null", async () => {
      const result = await queries.insert({
        site_id: siteId,
        session_id: Bun.randomUUIDv7(),
        visit_id: Bun.randomUUIDv7(),
        title: "About",
        href: "https://example.com/about",
        referrer: null,
        time_zone: "Europe/Zurich",
        user_agent: null,
        language: null,
        device_inner_width: 1280,
        device_inner_height: 720,
        device_screen_width: null,
        device_screen_height: null,
        client_browser: null,
        client_operating_system: null,
        client_device: null,
        campaign_utm_source: null,
        campaign_utm_medium: null,
        campaign_utm_campaign: null,
        campaign_utm_term: null,
        campaign_utm_content: null,
      });

      expect(result.status).toBe("success");
    });

    test("fails for invalid site_id", async () => {
      const result = await queries.insert({
        site_id: "00000000-0000-7000-8000-000000000000",
        session_id: Bun.randomUUIDv7(),
        visit_id: Bun.randomUUIDv7(),
        title: "Invalid",
        href: "https://example.com/invalid",
        referrer: null,
        time_zone: "Europe/Zurich",
        user_agent: null,
        language: null,
        device_inner_width: 1280,
        device_inner_height: 720,
        device_screen_width: null,
        device_screen_height: null,
        client_browser: null,
        client_operating_system: null,
        client_device: null,
        campaign_utm_source: null,
        campaign_utm_medium: null,
        campaign_utm_campaign: null,
        campaign_utm_term: null,
        campaign_utm_content: null,
      });

      expect(result.status).toBe("error");
    });
  });
});
