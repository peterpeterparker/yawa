import * as z from "zod";
import { AnalyticsSchema } from "yawa-schema/db";

export const QueryAnalyticsParamsSchema = z.strictObject({
  site_id: AnalyticsSchema.SiteSchema.shape.id.describe("The site ID to query"),
  from: z.iso.datetime().describe("Start of date range (YYYY-MM-DD HH:MM:SS)"),
  to: z.iso.datetime().describe("End of date range (YYYY-MM-DD HH:MM:SS)"),
});

export const QueryAnalyticsParamsWithLimitSchema = QueryAnalyticsParamsSchema.extend({
  limit: z
    .number()
    .int()
    .positive()
    .optional()
    .describe("Maximum number of results to return (default: 100)"),
});

export type QueryAnalyticsParams = z.infer<typeof QueryAnalyticsParamsSchema>;
export type QueryAnalyticsParamsWithLimit = z.infer<typeof QueryAnalyticsParamsWithLimitSchema>;
