import { createMiddleware } from "hono/factory";
import { DbSites } from "yawa-db";
import { isEmptyString, isNullish } from "yawa-common";
import type { AnalyticsApiEnv } from "../types/api";

export const loadSiteMiddleware = createMiddleware<AnalyticsApiEnv>(async (context, next) => {
  const {
    req,
    var: {
      db: { connection },
    },
  } = context;

  const origin = req.header("Origin");

  if (isEmptyString(origin)) {
    return context.json({ error: "Forbidden" }, 403);
  }

  const url = URL.parse(origin);

  if (isNullish(url)) {
    return context.json({ error: "Forbidden" }, 403);
  }

  const { hostname } = url;

  const result = await DbSites.create({ connection }).findActiveByHostname({ hostname });

  if (result.status === "error") {
    return context.json({ error: "Forbidden" }, 403);
  }

  const { result: site } = result;

  if (isNullish(site)) {
    return context.json({ error: "Forbidden" }, 403);
  }

  context.set("site", site);

  await next();
});
