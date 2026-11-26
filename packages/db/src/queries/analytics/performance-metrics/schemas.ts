import * as z from "zod";
import { QueryAnalyticsParamsWithLimitSchema } from "../types";
import { AnalyticsSchema } from "yawa-schema/db";

export const QueryAnalyticsParamsWithMetricSchema = QueryAnalyticsParamsWithLimitSchema.extend({
  metric_name: AnalyticsSchema.PerformanceMetricSchema.shape.metric_name.describe(
    "The metric name to filter by (CLS, FCP, INP, LCP, TTFB)",
  ),
});

export type QueryAnalyticsParamsWithMetric = z.infer<typeof QueryAnalyticsParamsWithMetricSchema>;

export const VitalsSummarySchema = z.strictObject({
  metric_name: z.string(),
  avg: z.coerce.number(),
  p75: z.coerce.number(),
  p90: z.coerce.number(),
  count: z.coerce.number(),
});

export const ListVitalsSummarySchema = z.array(VitalsSummarySchema);

export const VitalsByPageSchema = z.strictObject({
  href: z.string(),
  avg: z.coerce.number(),
  p75: z.coerce.number(),
  count: z.coerce.number(),
});

export const ListVitalsByPageSchema = z.array(VitalsByPageSchema);

export const VitalsDistributionSchema = z.strictObject({
  metric_name: z.string(),
  good: z.coerce.number(),
  needs_improvement: z.coerce.number(),
  poor: z.coerce.number(),
  total: z.coerce.number(),
});

export const ListVitalsDistributionSchema = z.array(VitalsDistributionSchema);
