import type { DbConnection } from "../../db/connection";
import type { Result } from "yawa-common";
import * as z from "zod";
import { AnalyticsSchema } from "yawa-schema/db";
import { type QueryAnalyticsParams, QueryAnalyticsParamsWithLimitSchema } from "./types";

export const QueryAnalyticsParamsWithMetricSchema = QueryAnalyticsParamsWithLimitSchema.extend({
  metric_name: AnalyticsSchema.PerformanceMetricSchema.shape.metric_name.describe(
    "The metric name to filter by (CLS, FCP, INP, LCP, TTFB)",
  ),
});

type QueryAnalyticsParamsWithMetric = z.infer<typeof QueryAnalyticsParamsWithMetricSchema>;

const VitalsSummarySchema = z.strictObject({
  metric_name: z.string(),
  avg: z.coerce.number(),
  p75: z.coerce.number(),
  p90: z.coerce.number(),
  count: z.coerce.number(),
});

export const ListVitalsSummarySchema = z.array(VitalsSummarySchema);

const VitalsByPageSchema = z.strictObject({
  href: z.string(),
  avg: z.coerce.number(),
  p75: z.coerce.number(),
  count: z.coerce.number(),
});

export const ListVitalsByPageSchema = z.array(VitalsByPageSchema);

const VitalsDistributionSchema = z.strictObject({
  metric_name: z.string(),
  good: z.coerce.number(),
  needs_improvement: z.coerce.number(),
  poor: z.coerce.number(),
  total: z.coerce.number(),
});

export const ListVitalsDistributionSchema = z.array(VitalsDistributionSchema);

export class DbPerformanceMetricsAnalytics {
  #connection: DbConnection;

  private constructor({ connection }: { connection: DbConnection }) {
    this.#connection = connection;
  }

  static create({ connection }: { connection: DbConnection }): DbPerformanceMetricsAnalytics {
    return new this({ connection });
  }

  /**
   * Average, p75 and p90 per metric name.
   */
  async getWebVitalsSummary({
    site_id,
    from,
    to,
  }: QueryAnalyticsParams): Promise<Result<z.infer<typeof ListVitalsSummarySchema>>> {
    return this.#connection.query({
      sql: `SELECT
              metric_name::VARCHAR AS metric_name,
              AVG(value) AS avg,
              QUANTILE_CONT(value, 0.75) AS p75,
              QUANTILE_CONT(value, 0.90) AS p90,
              COUNT(*) AS count
            FROM yawa_analytics.performance_metrics
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
            GROUP BY metric_name ORDER BY metric_name`,
      schema: VitalsSummarySchema,
      values: { site_id, from, to },
    });
  }

  /**
   * Per-page breakdown for a specific metric, ranked by p75.
   */
  async getWebVitalsByPage({
    site_id,
    from,
    to,
    metric_name,
    limit = 100,
  }: QueryAnalyticsParamsWithMetric): Promise<Result<z.infer<typeof ListVitalsByPageSchema>>> {
    return this.#connection.query({
      sql: `SELECT
              href,
              AVG(value) AS avg,
              QUANTILE_CONT(value, 0.75) AS p75,
              COUNT(*) AS count
            FROM yawa_analytics.performance_metrics
            WHERE site_id = $site_id
              AND created_at BETWEEN $from AND $to
              AND metric_name = $metric_name
            GROUP BY href ORDER BY p75 DESC LIMIT $limit`,
      schema: VitalsByPageSchema,
      values: { site_id, from, to, metric_name, limit },
    });
  }

  /**
   * Good/needs improvement/poor distribution per metric name based on Core Web Vitals thresholds.
   */
  async getWebVitalsDistribution({
    site_id,
    from,
    to,
  }: QueryAnalyticsParams): Promise<Result<z.infer<typeof ListVitalsDistributionSchema>>> {
    return this.#connection.query({
      sql: `SELECT
              metric_name::VARCHAR AS metric_name,
              COUNT(*) FILTER (WHERE
                (metric_name = 'LCP' AND value < 2500) OR
                (metric_name = 'INP' AND value < 200) OR
                (metric_name = 'CLS' AND value < 0.1) OR
                (metric_name = 'FCP' AND value < 1800) OR
                (metric_name = 'TTFB' AND value < 800)
              ) AS good,
              COUNT(*) FILTER (WHERE
                (metric_name = 'LCP' AND value >= 2500 AND value < 4000) OR
                (metric_name = 'INP' AND value >= 200 AND value < 500) OR
                (metric_name = 'CLS' AND value >= 0.1 AND value < 0.25) OR
                (metric_name = 'FCP' AND value >= 1800 AND value < 3000) OR
                (metric_name = 'TTFB' AND value >= 800 AND value < 1800)
              ) AS needs_improvement,
              COUNT(*) FILTER (WHERE
                (metric_name = 'LCP' AND value >= 4000) OR
                (metric_name = 'INP' AND value >= 500) OR
                (metric_name = 'CLS' AND value >= 0.25) OR
                (metric_name = 'FCP' AND value >= 3000) OR
                (metric_name = 'TTFB' AND value >= 1800)
              ) AS poor,
              COUNT(*) AS total
            FROM yawa_analytics.performance_metrics
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
            GROUP BY metric_name ORDER BY metric_name`,
      schema: VitalsDistributionSchema,
      values: { site_id, from, to },
    });
  }
}
