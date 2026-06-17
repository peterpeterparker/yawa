import type { AnalyticsApiEnv } from "../types/api";
import { createMiddleware } from "hono/factory";
import { getIp } from "../utils/ip";

export const extractIpMiddleware = createMiddleware<AnalyticsApiEnv>(async (context, next) => {
  const {
    req: {
      raw: { headers },
    },
  } = context;

  context.set("ip", getIp({ headers }));

  await next();
});
