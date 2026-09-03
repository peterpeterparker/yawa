import { AppSchema, CommonSchema } from "yawa-schema/app";
import { DbPerformanceMetrics } from "yawa-db";
import type { AnalyticsSessionApiEnv } from "./types/api";
import { createRoute } from "@hono/zod-openapi";
import type { DefineZodHandler } from "../types/api";

export const performanceMetricRoute = createRoute({
  method: "post",
  path: "/metric",
  tags: ["Events"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AppSchema.Analytics.CreatePerformanceMetricRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "Performance metric recorded successfully",
    },
    500: {
      content: {
        "application/json": {
          schema: CommonSchema.Error.ErrorSchema,
        },
      },
      description: "Internal server error while saving to database",
    },
  },
});

export const defineCreatePerformanceMetric: DefineZodHandler<
  typeof performanceMetricRoute,
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
