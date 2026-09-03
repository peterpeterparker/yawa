import { AppSchema, CommonSchema } from "yawa-schema/app";
import { DbTrackEvents } from "yawa-db";
import type { AnalyticsSessionApiEnv } from "./types/api";
import { createRoute } from "@hono/zod-openapi";
import type { DefineZodHandler } from "../types/api";

export const trackEventRoute = createRoute({
  method: "post",
  path: "/track",
  tags: ["Events"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: AppSchema.Analytics.CreateTrackEventRequestSchema,
        },
      },
    },
  },
  responses: {
    204: {
      description: "Track event recorded successfully",
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

export const defineCreateTrackEvent: DefineZodHandler<
  typeof trackEventRoute,
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

  const { visit_id, name, metadata } = req.valid("json");

  const result = await DbTrackEvents.create({ connection }).insert({
    site_id,
    session_id,
    visit_id,
    name,
    metadata: metadata ?? null,
  });

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to record track event" }, 500);
  }

  return context.newResponse(null, 204);
};
