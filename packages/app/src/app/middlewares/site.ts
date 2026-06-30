import { createMiddleware } from "hono/factory";
import { DbSites } from "yawa-db";
import { isEmptyString, isNullish, nonNullish, type Option, type Result } from "yawa-common";
import type { AnalyticsApiEnv } from "../types/api";
import type { Analytics } from "yawa-schema/db";

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

  const loadSite = async (): Promise<Result<Option<Analytics["Site"]>>> => {
    const dbSites = DbSites.create({ connection });

    const result = await dbSites.findActiveByHostname({ hostname });

    if (result.status === "error") {
      return result;
    }

    const { result: site } = result;

    if (nonNullish(site)) {
      return result;
    }

    return await dbSites.findActiveByLinkedHostname({ hostname });
  };

  const result = await loadSite();

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
