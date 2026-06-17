import type { DefineHandler } from "../types/api";
import { AppSchema } from "yawa-schema/app";
import { DbTrackEvents } from "yawa-db";
import type { AnalyticsSessionApiEnv } from "./types/api";

export const defineCreateTrackEvent: DefineHandler<
  typeof AppSchema.Analytics.CreateTrackEventRequestSchema,
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
