import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { __createDbInstanceForTest__, DbInstance, DbPageViews, DbSites } from "../../../src";
import { DbPageViewsAnalytics } from "../../../src/queries/analytics/page-views";

const pageView = (
  siteId: string,
  overrides: Partial<{
    href: string;
    referrer: string | null;
    session_id: string;
    visit_id: string;
    created_at: string;
    client_browser: string | null;
    client_operating_system: string | null;
    client_device: string | null;
    language: string | null;
    time_zone: string;
    campaign_utm_source: string | null;
    campaign_utm_medium: string | null;
    campaign_utm_campaign: string | null;
    campaign_utm_content: string | null;
    campaign_utm_term: string | null;
  }> = {},
) => ({
  site_id: siteId,
  session_id: Bun.randomUUIDv7(),
  visit_id: Bun.randomUUIDv7(),
  title: "Test Page",
  href: "https://example.com/",
  referrer: null,
  time_zone: "Europe/Zurich",
  user_agent: "Mozilla/5.0",
  language: "en",
  device_inner_width: 1920,
  device_inner_height: 1080,
  device_screen_width: null,
  device_screen_height: null,
  client_browser: "Chrome",
  client_operating_system: "macOS",
  client_device: "desktop",
  campaign_utm_source: null,
  campaign_utm_medium: null,
  campaign_utm_campaign: null,
  campaign_utm_term: null,
  campaign_utm_content: null,
  ...overrides,
});

describe("DbQueryPageViewsAnalytics", () => {
  let instance: DbInstance;
  let analytics: DbPageViewsAnalytics;
  let siteId: string;

  const from = "2026-01-01 00:00:00";
  const to = "2026-12-31 23:59:59";

  beforeEach(async () => {
    instance = await __createDbInstanceForTest__();

    const connectionResult = await instance.connect();
    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    const { result: connection } = connectionResult;

    const siteResult = await DbSites.create({ connection }).insert({
      hostname: "example.com",
    });
    if (siteResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    siteId = siteResult.result.id;
    analytics = DbPageViewsAnalytics.create({ connection });

    const pageViews = DbPageViews.create({ connection });

    // session A: 2 pageviews (not a bounce)
    const sessionA = Bun.randomUUIDv7();
    const visitA = Bun.randomUUIDv7();
    await pageViews.insert(
      pageView(siteId, {
        session_id: sessionA,
        visit_id: visitA,
        href: "https://example.com/",
        referrer: "https://twitter.com",
        campaign_utm_source: "twitter",
        campaign_utm_medium: "social",
        language: "en",
      }),
    );
    await pageViews.insert(
      pageView(siteId, {
        session_id: sessionA,
        visit_id: visitA,
        href: "https://example.com/about",
        client_browser: "Firefox",
        client_operating_system: "Windows",
        client_device: "desktop",
      }),
    );

    // session B: 1 pageview (bounce)
    const sessionB = Bun.randomUUIDv7();
    const visitB = Bun.randomUUIDv7();
    await pageViews.insert(
      pageView(siteId, {
        session_id: sessionB,
        visit_id: visitB,
        href: "https://example.com/blog",
        referrer: "https://google.com",
        campaign_utm_source: "google",
        campaign_utm_medium: "cpc",
        campaign_utm_campaign: "launch",
        language: "fr",
        client_device: "mobile",
        client_browser: "Safari",
        client_operating_system: "iOS",
      }),
    );
  });

  afterEach(async () => {
    await instance.close();
  });

  describe("getStats", () => {
    test("returns correct pageview, visitor, visit and bounce counts", async () => {
      const result = await analytics.getStats({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result?.pageviews).toBe(3);
      expect(result.result?.visitors).toBe(2);
      expect(result.result?.visits).toBe(2);
      expect(result.result?.bounces).toBe(1);
    });
  });

  describe("getPageviewsSeries", () => {
    test("returns daily series with pageviews and visitors", async () => {
      const result = await analytics.getPageviewsSeries({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBeGreaterThan(0);
      expect(result.result[0]).toHaveProperty("date");
      expect(result.result[0]).toHaveProperty("pageviews");
      expect(result.result[0]).toHaveProperty("visitors");
    });
  });

  describe("getPageviewsByHour", () => {
    test("returns hourly breakdown", async () => {
      const result = await analytics.getPageviewsByHour({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBeGreaterThan(0);
      expect(result.result[0]?.hour).toBeGreaterThanOrEqual(0);
      expect(result.result[0]?.hour).toBeLessThanOrEqual(23);
    });
  });

  describe("getTopPages", () => {
    test("returns pages sorted by visitors", async () => {
      const result = await analytics.getTopPages({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBe(3);
      expect(result.result[0]).toHaveProperty("href");
      expect(result.result[0]).toHaveProperty("visitors");
      expect(result.result[0]).toHaveProperty("pageviews");
    });

    test("respects limit", async () => {
      const result = await analytics.getTopPages({ site_id: siteId, from, to, limit: 1 });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBe(1);
    });
  });

  describe("getTopPagesExpanded", () => {
    test("returns expanded metrics per page", async () => {
      const result = await analytics.getTopPagesExpanded({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBeGreaterThan(0);
      expect(result.result[0]).toHaveProperty("bounces");
      expect(result.result[0]).toHaveProperty("totaltime");
    });
  });

  describe("getTopTitles", () => {
    test("returns page titles", async () => {
      const result = await analytics.getTopTitles({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBeGreaterThan(0);
      expect(result.result[0]?.name).toBe("Test Page");
    });
  });

  describe("getEntryPages", () => {
    test("returns first pages of visits", async () => {
      const result = await analytics.getEntryPages({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBeGreaterThan(0);
    });
  });

  describe("getExitPages", () => {
    test("returns last pages of visits", async () => {
      const result = await analytics.getExitPages({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBeGreaterThan(0);
    });
  });

  describe("getTopReferrers", () => {
    test("returns referrers excluding empty", async () => {
      const result = await analytics.getTopReferrers({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBe(2);
      expect(result.result.every((r) => r.name !== "")).toBe(true);
    });
  });

  describe("getTopReferrersExpanded", () => {
    test("returns expanded referrer metrics", async () => {
      const result = await analytics.getTopReferrersExpanded({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBeGreaterThan(0);
      expect(result.result[0]).toHaveProperty("totaltime");
    });
  });

  describe("getBrowsers", () => {
    test("returns browser breakdown", async () => {
      const result = await analytics.getBrowsers({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const names = result.result.map((r) => r.name);
      expect(names).toContain("Chrome");
      expect(names).toContain("Safari");
    });
  });

  describe("getOperatingSystems", () => {
    test("returns OS breakdown", async () => {
      const result = await analytics.getOperatingSystems({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const names = result.result.map((r) => r.name);
      expect(names).toContain("macOS");
    });
  });

  describe("getDevices", () => {
    test("returns device breakdown", async () => {
      const result = await analytics.getDevices({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const names = result.result.map((r) => r.name);
      expect(names).toContain("desktop");
      expect(names).toContain("mobile");
    });
  });

  describe("getLanguages", () => {
    test("returns language breakdown normalized to 2 chars", async () => {
      const result = await analytics.getLanguages({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const names = result.result.map((r) => r.name);
      expect(names).toContain("en");
      expect(names).toContain("fr");
    });
  });

  describe("getTimeZones", () => {
    test("returns time zone breakdown", async () => {
      const result = await analytics.getTimeZones({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result[0]?.name).toBe("Europe/Zurich");
    });
  });

  describe("getUtmSources", () => {
    test("returns utm source breakdown", async () => {
      const result = await analytics.getUtmSources({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const names = result.result.map((r) => r.name);
      expect(names).toContain("twitter");
      expect(names).toContain("google");
    });
  });

  describe("getUtmMediums", () => {
    test("returns utm medium breakdown", async () => {
      const result = await analytics.getUtmMediums({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const names = result.result.map((r) => r.name);
      expect(names).toContain("social");
      expect(names).toContain("cpc");
    });
  });

  describe("getUtmCampaigns", () => {
    test("returns utm campaign breakdown", async () => {
      const result = await analytics.getUtmCampaigns({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result[0]?.name).toBe("launch");
    });
  });

  describe("getUtmContents", () => {
    test("returns empty when no utm content set", async () => {
      const result = await analytics.getUtmContents({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBe(0);
    });
  });

  describe("getUtmTerms", () => {
    test("returns empty when no utm term set", async () => {
      const result = await analytics.getUtmTerms({ site_id: siteId, from, to });

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.length).toBe(0);
    });
  });
});
