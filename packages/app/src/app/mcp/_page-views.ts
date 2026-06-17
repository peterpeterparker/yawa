import {
  DbPageViewsAnalytics,
  ListExpandedSchema,
  ListHourSchema,
  ListMetricSchema,
  ListPageSchema,
  ListSeriesSchema,
  ListTitleSchema,
  OptionStatsSchema,
  QueryAnalyticsParamsSchema,
  QueryAnalyticsParamsWithLimitSchema,
} from "yawa-db";
import { McpTools, type McpToolsInitArgs } from "./_tools";

export class McpToolsPageViews extends McpTools {
  readonly #analytics: DbPageViewsAnalytics;

  private constructor({ connection, server }: McpToolsInitArgs) {
    super({ server });
    this.#analytics = DbPageViewsAnalytics.create({ connection });
  }

  static create(args: McpToolsInitArgs): McpToolsPageViews {
    return new this(args);
  }

  override registerTools() {
    this.#registerGetStats();
    this.#registerGetPageViewsSeries();
    this.#registerGetPageViewsByHour();
    this.#registerGetTopPages();
    this.#registerGetTopPagesExpanded();
    this.#registerGetTopTitles();
    this.#registerGetEntryPages();
    this.#registerGetExitPages();
    this.#registerGetTopReferrers();
    this.#registerGetTopReferrersExpanded();
    this.#registerGetBrowsers();
    this.#registerGetOperatingSystems();
    this.#registerGetDevices();
    this.#registerGetLanguages();
    this.#registerGetTimeZones();
    this.#registerGetUtmSources();
    this.#registerGetUtmMediums();
    this.#registerGetUtmCampaigns();
    this.#registerGetUtmContents();
    this.#registerGetUtmTerms();
  }

  #registerGetStats() {
    this.registerTool({
      title: "get_stats",
      description: "Returns total pageviews, unique visitors, visits and bounces for a date range.",
      inputSchema: QueryAnalyticsParamsSchema,
      outputSchema: OptionStatsSchema,
      fn: async ({ site_id, from, to }) => {
        return await this.#analytics.getStats({ site_id, from, to });
      },
    });
  }

  #registerGetPageViewsSeries() {
    this.registerTool({
      title: "get_pageviews_series",
      description:
        "Returns daily pageviews and unique visitors over a date range. Useful for trend charts and identifying traffic spikes.",
      inputSchema: QueryAnalyticsParamsSchema,
      outputSchema: ListSeriesSchema,
      fn: async ({ site_id, from, to }) => {
        return await this.#analytics.getPageviewsSeries({ site_id, from, to });
      },
    });
  }

  #registerGetPageViewsByHour() {
    this.registerTool({
      title: "get_pageviews_by_hour",
      description:
        "Returns pageviews and unique visitors bucketed by hour of day (0-23). Useful for identifying peak traffic hours.",
      inputSchema: QueryAnalyticsParamsSchema,
      outputSchema: ListHourSchema,
      fn: async ({ site_id, from, to }) => {
        return await this.#analytics.getPageviewsByHour({ site_id, from, to });
      },
    });
  }

  #registerGetTopPages() {
    this.registerTool({
      title: "get_top_pages",
      description: "Returns the most visited URLs ranked by unique visitors.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListPageSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getTopPages({ site_id, from, to, limit });
      },
    });
  }

  #registerGetTopPagesExpanded() {
    this.registerTool({
      title: "get_top_pages_expanded",
      description:
        "Returns top pages with expanded engagement metrics: pageviews, visitors, visits, bounces and total time spent. Useful for identifying high-traffic but low-engagement pages.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListExpandedSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getTopPagesExpanded({ site_id, from, to, limit });
      },
    });
  }

  #registerGetTopTitles() {
    this.registerTool({
      title: "get_top_titles",
      description:
        "Returns top page titles by unique visitors. Useful when URLs are dynamic but titles are descriptive.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListTitleSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getTopTitles({ site_id, from, to, limit });
      },
    });
  }

  #registerGetEntryPages() {
    this.registerTool({
      title: "get_entry_pages",
      description:
        "Returns the most common first pages visited per session (landing pages). Identifies where visitors enter the site.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getEntryPages({ site_id, from, to, limit });
      },
    });
  }

  #registerGetExitPages() {
    this.registerTool({
      title: "get_exit_pages",
      description:
        "Returns the most common last pages visited per session (exit pages). Identifies where visitors leave the site.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getExitPages({ site_id, from, to, limit });
      },
    });
  }

  #registerGetTopReferrers() {
    this.registerTool({
      title: "get_top_referrers",
      description:
        "Returns top referrers by unique visitors. Identifies where traffic is coming from.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getTopReferrers({ site_id, from, to, limit });
      },
    });
  }

  #registerGetTopReferrersExpanded() {
    this.registerTool({
      title: "get_top_referrers_expanded",
      description:
        "Returns top referrers with expanded engagement metrics: pageviews, visitors, visits, bounces and total time spent. Useful for comparing referral quality.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListExpandedSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getTopReferrersExpanded({ site_id, from, to, limit });
      },
    });
  }

  #registerGetBrowsers() {
    this.registerTool({
      title: "get_browsers",
      description: "Returns browser breakdown by unique visitors (Chrome, Safari, Firefox, etc.).",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getBrowsers({ site_id, from, to, limit });
      },
    });
  }

  #registerGetOperatingSystems() {
    this.registerTool({
      title: "get_operating_systems",
      description:
        "Returns operating system breakdown by unique visitors (macOS, Windows, iOS, Android, etc.).",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getOperatingSystems({ site_id, from, to, limit });
      },
    });
  }

  #registerGetDevices() {
    this.registerTool({
      title: "get_devices",
      description: "Returns device type breakdown by unique visitors (mobile, tablet, desktop).",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getDevices({ site_id, from, to, limit });
      },
    });
  }

  #registerGetLanguages() {
    this.registerTool({
      title: "get_languages",
      description:
        "Returns language breakdown by unique visitors, normalized to 2-letter codes (en, fr, de, etc.).",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getLanguages({ site_id, from, to, limit });
      },
    });
  }

  #registerGetTimeZones() {
    this.registerTool({
      title: "get_time_zones",
      description:
        "Returns time zone breakdown by unique visitors. Useful for understanding where visitors are located.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getTimeZones({ site_id, from, to, limit });
      },
    });
  }

  #registerGetUtmSources() {
    this.registerTool({
      title: "get_utm_sources",
      description:
        "Returns UTM source breakdown by unique visitors. Identifies which traffic sources (twitter, newsletter, etc.) are driving visits.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getUtmSources({ site_id, from, to, limit });
      },
    });
  }

  #registerGetUtmMediums() {
    this.registerTool({
      title: "get_utm_mediums",
      description:
        "Returns UTM medium breakdown by unique visitors. Identifies which marketing channels (email, social, cpc, etc.) are driving visits.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getUtmMediums({ site_id, from, to, limit });
      },
    });
  }

  #registerGetUtmCampaigns() {
    this.registerTool({
      title: "get_utm_campaigns",
      description:
        "Returns UTM campaign breakdown by unique visitors. Identifies which specific campaigns are driving visits.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getUtmCampaigns({ site_id, from, to, limit });
      },
    });
  }

  #registerGetUtmContents() {
    this.registerTool({
      title: "get_utm_contents",
      description:
        "Returns UTM content breakdown by unique visitors. Identifies which specific links or ad variants within a campaign are driving visits.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getUtmContents({ site_id, from, to, limit });
      },
    });
  }

  #registerGetUtmTerms() {
    this.registerTool({
      title: "get_utm_terms",
      description:
        "Returns UTM term breakdown by unique visitors. Identifies which paid search keywords are driving visits.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListMetricSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getUtmTerms({ site_id, from, to, limit });
      },
    });
  }
}
