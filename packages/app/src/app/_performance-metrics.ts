import type { DefineHandler } from "../types/api";
import { AppSchema } from "yawa-schema/app";
import { DbPerformanceMetrics } from "yawa-db";
import type { AnalyticsSessionApiEnv } from "./types/api";

export const defineCreatePerformanceMetric: DefineHandler<
  typeof AppSchema.Analytics.CreatePerformanceMetricRequestSchema,
  AnalyticsSessionApiEnv
> = async (context) => {
  const {
    req,
    var: {
      db: { connection },
      site: { id: site_id },
      sessionId: session_id,
    },
  } = context;

  const { visit_id, href, metric_name, value, delta, metric_id, navigation_type } =
    req.valid("json");

  const result = await DbPerformanceMetrics.create({ connection }).insert({
    site_id,
    session_id,
    visit_id,
    href,
    metric_name,
    value,
    delta,
    metric_id,
    navigation_type: navigation_type ?? null,
  });

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to record performance metric" }, 500);
  }

  return context.newResponse(null, 204);
};
