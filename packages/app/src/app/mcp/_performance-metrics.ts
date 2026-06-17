import {
  DbPerformanceMetricsAnalytics,
  ListVitalsByPageSchema,
  ListVitalsDistributionSchema,
  ListVitalsSummarySchema,
  QueryAnalyticsParamsSchema,
  QueryAnalyticsParamsWithMetricSchema,
} from "yawa-db";
import { McpTools, type McpToolsInitArgs } from "./_tools";

export class McpToolsPerformanceMetrics extends McpTools {
  readonly #analytics: DbPerformanceMetricsAnalytics;

  private constructor(args: McpToolsInitArgs) {
    super(args);
    this.#analytics = DbPerformanceMetricsAnalytics.create({ connection: args.connection });
  }

  static create(args: McpToolsInitArgs): McpToolsPerformanceMetrics {
    return new this(args);
  }

  override registerTools() {
    this.#registerGetWebVitalsSummary();
    this.#registerGetWebVitalsByPage();
    this.#registerGetWebVitalsDistribution();
  }

  #registerGetWebVitalsSummary() {
    this.registerTool({
      title: "get_web_vitals_summary",
      description:
        "Returns average, p75 and p90 for each Core Web Vital (CLS, FCP, INP, LCP, TTFB). Useful for a quick overview of site performance.",
      inputSchema: QueryAnalyticsParamsSchema,
      outputSchema: ListVitalsSummarySchema,
      fn: async ({ site_id, from, to }) => {
        return await this.#analytics.getWebVitalsSummary({ site_id, from, to });
      },
    });
  }

  #registerGetWebVitalsByPage() {
    this.registerTool({
      title: "get_web_vitals_by_page",
      description:
        "Returns per-page breakdown for a specific metric ranked by p75. Useful for identifying which pages have the worst performance.",
      inputSchema: QueryAnalyticsParamsWithMetricSchema,
      outputSchema: ListVitalsByPageSchema,
      fn: async ({ site_id, from, to, metric_name, limit }) => {
        return await this.#analytics.getWebVitalsByPage({ site_id, from, to, metric_name, limit });
      },
    });
  }

  #registerGetWebVitalsDistribution() {
    this.registerTool({
      title: "get_web_vitals_distribution",
      description:
        "Returns good/needs improvement/poor counts per metric based on Core Web Vitals thresholds. Useful for understanding the overall health of site performance.",
      inputSchema: QueryAnalyticsParamsSchema,
      outputSchema: ListVitalsDistributionSchema,
      fn: async ({ site_id, from, to }) => {
        return await this.#analytics.getWebVitalsDistribution({ site_id, from, to });
      },
    });
  }
}
