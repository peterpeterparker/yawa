import { describe, test, expect, beforeEach, afterEach } from "bun:test";
import {
  __createDbInstanceForTest__,
  DbInstance,
  DbPageViews,
  DbPerformanceMetrics,
  DbSites,
  DbTrackEvents,
} from "yawa-db";
import { McpHandler } from "../../../src/app/mcp/mcp";
import { type Context, Hono } from "hono";

const makeContext = async (request: Request) => {
  let ctx: Context;
  const app = new Hono();

  app.all("*", (c) => {
    ctx = c;
    return c.body(null);
  });

  await app.fetch(request);
  // @ts-ignore
  return ctx;
};

const makeRequest = (body: unknown) =>
  new Request("http://localhost/mcp", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
    },
    body: JSON.stringify(body),
  });

const callTool = (name: string, args: Record<string, unknown>) =>
  makeRequest({
    jsonrpc: "2.0",
    method: "tools/call",
    params: { name, arguments: args },
    id: 2,
  });

const pageView = (siteId: string, overrides: Record<string, unknown> = {}) => ({
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

const from = "2026-01-01T00:00:00.000Z";
const to = "2026-12-31T23:59:59.000Z";

describe("McpPageViewsHandler", () => {
  let instance: DbInstance;
  let handler: McpHandler;
  let siteId: string;

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
    handler = McpHandler.create({ connection });

    const pageViews = DbPageViews.create({ connection });
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
        campaign_utm_campaign: "launch",
      }),
    );
    await pageViews.insert(
      pageView(siteId, {
        session_id: sessionA,
        visit_id: visitA,
        href: "https://example.com/about",
      }),
    );

    const sessionB = Bun.randomUUIDv7();
    const visitB = Bun.randomUUIDv7();
    await pageViews.insert(
      pageView(siteId, {
        session_id: sessionB,
        visit_id: visitB,
        href: "https://example.com/blog",
        referrer: "https://google.com",
        client_browser: "Safari",
        client_operating_system: "iOS",
        client_device: "mobile",
        language: "fr",
      }),
    );

    const events = DbTrackEvents.create({ connection });
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
      name: "form_submit",
      metadata: null,
    });

    const metrics = DbPerformanceMetrics.create({ connection });
    await metrics.insert({
      site_id: siteId,
      session_id: sessionA,
      visit_id: Bun.randomUUIDv7(),
      href: "https://example.com/",
      metric_name: "LCP",
      value: 1200,
      delta: 1200,
      metric_id: "v3-lcp-1",
      navigation_type: "navigate",
    });
    await metrics.insert({
      site_id: siteId,
      session_id: sessionB,
      visit_id: Bun.randomUUIDv7(),
      href: "https://example.com/",
      metric_name: "CLS",
      value: 0.05,
      delta: 0.05,
      metric_id: "v3-cls-1",
      navigation_type: null,
    });
  });

  afterEach(async () => {
    await instance.close();
  });

  const callAndParse = async (toolName: string, args: Record<string, unknown>) => {
    // note: stateless no need of a first handleRequest to call method initialize

    const request = callTool(toolName, args);
    const context = await makeContext(request);

    const result = await handler.handleRequest({
      context,
      __useJsonResponseForTest__: true,
    });

    expect(result.status).toBe("success");
    if (result.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    const body = await result.result?.json();
    // @ts-ignore
    expect(body.result?.isError).toBeUndefined();
    // @ts-ignore
    return body.result?.structuredContent?.result;
  };

  const args = () => ({ site_id: siteId, from, to });

  test("get_stats returns pageview metrics", async () => {
    const result = await callAndParse("get_stats", args());
    expect(result.pageviews).toBe(3);
    expect(result.visitors).toBe(2);
    expect(result.visits).toBe(2);
    expect(result.bounces).toBe(1);
  });

  test("get_pageviews_series returns daily series", async () => {
    const result = await callAndParse("get_pageviews_series", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty("date");
    expect(result[0]).toHaveProperty("pageviews");
  });

  test("get_pageviews_by_hour returns hourly breakdown", async () => {
    const result = await callAndParse("get_pageviews_by_hour", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("hour");
  });

  test("get_top_pages returns pages ranked by visitors", async () => {
    const result = await callAndParse("get_top_pages", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("href");
    expect(result[0]).toHaveProperty("visitors");
  });

  test("get_top_pages_expanded returns expanded metrics", async () => {
    const result = await callAndParse("get_top_pages_expanded", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("bounces");
    expect(result[0]).toHaveProperty("totaltime");
  });

  test("get_top_titles returns page titles", async () => {
    const result = await callAndParse("get_top_titles", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]?.name).toBe("Test Page");
  });

  test("get_entry_pages returns landing pages", async () => {
    const result = await callAndParse("get_entry_pages", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("name");
  });

  test("get_exit_pages returns exit pages", async () => {
    const result = await callAndParse("get_exit_pages", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("name");
  });

  test("get_top_referrers returns referrers", async () => {
    const result = await callAndParse("get_top_referrers", args());
    expect(Array.isArray(result)).toBe(true);
    const names = result.map((r: { name: string }) => r.name);
    expect(names).toContain("https://twitter.com");
  });

  test("get_top_referrers_expanded returns expanded referrer metrics", async () => {
    const result = await callAndParse("get_top_referrers_expanded", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("totaltime");
  });

  test("get_browsers returns browser breakdown", async () => {
    const result = await callAndParse("get_browsers", args());
    const names = result.map((r: { name: string }) => r.name);
    expect(names).toContain("Chrome");
    expect(names).toContain("Safari");
  });

  test("get_operating_systems returns OS breakdown", async () => {
    const result = await callAndParse("get_operating_systems", args());
    const names = result.map((r: { name: string }) => r.name);
    expect(names).toContain("macOS");
  });

  test("get_devices returns device breakdown", async () => {
    const result = await callAndParse("get_devices", args());
    const names = result.map((r: { name: string }) => r.name);
    expect(names).toContain("desktop");
    expect(names).toContain("mobile");
  });

  test("get_languages returns language breakdown", async () => {
    const result = await callAndParse("get_languages", args());
    const names = result.map((r: { name: string }) => r.name);
    expect(names).toContain("en");
    expect(names).toContain("fr");
  });

  test("get_time_zones returns time zone breakdown", async () => {
    const result = await callAndParse("get_time_zones", args());
    expect(result[0]?.name).toBe("Europe/Zurich");
  });

  test("get_utm_sources returns utm sources", async () => {
    const result = await callAndParse("get_utm_sources", args());
    expect(result[0]?.name).toBe("twitter");
  });

  test("get_utm_mediums returns utm mediums", async () => {
    const result = await callAndParse("get_utm_mediums", args());
    expect(result[0]?.name).toBe("social");
  });

  test("get_utm_campaigns returns utm campaigns", async () => {
    const result = await callAndParse("get_utm_campaigns", args());
    expect(result[0]?.name).toBe("launch");
  });

  test("get_utm_contents returns empty when none set", async () => {
    const result = await callAndParse("get_utm_contents", args());
    expect(result).toHaveLength(0);
  });

  test("get_utm_terms returns empty when none set", async () => {
    const result = await callAndParse("get_utm_terms", args());
    expect(result).toHaveLength(0);
  });

  test("list_sites returns all sites", async () => {
    const result = await callAndParse("list_sites", {});
    expect(Array.isArray(result)).toBe(true);
    expect(result).toHaveLength(1);
    expect(result[0].hostname).toBe("example.com");
    expect(result[0]).toHaveProperty("id");
    expect(result[0]).toHaveProperty("status");
  });

  test("get_top_events returns events ranked by count", async () => {
    const result = await callAndParse("get_top_events", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("count");
    expect(result[0]).toHaveProperty("visitors");
  });

  test("get_event_series returns daily series", async () => {
    const result = await callAndParse("get_event_series", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("date");
    expect(result[0]).toHaveProperty("name");
    expect(result[0]).toHaveProperty("count");
  });

  test("get_web_vitals_summary returns per-metric summary", async () => {
    const result = await callAndParse("get_web_vitals_summary", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("metric_name");
    expect(result[0]).toHaveProperty("avg");
    expect(result[0]).toHaveProperty("p75");
  });

  test("get_web_vitals_by_page returns per-page breakdown", async () => {
    const result = await callAndParse("get_web_vitals_by_page", { ...args(), metric_name: "LCP" });
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("href");
    expect(result[0]).toHaveProperty("p75");
  });

  test("get_web_vitals_distribution returns good/needs_improvement/poor", async () => {
    const result = await callAndParse("get_web_vitals_distribution", args());
    expect(Array.isArray(result)).toBe(true);
    expect(result[0]).toHaveProperty("good");
    expect(result[0]).toHaveProperty("needs_improvement");
    expect(result[0]).toHaveProperty("poor");
    expect(result[0]).toHaveProperty("total");
  });
});
