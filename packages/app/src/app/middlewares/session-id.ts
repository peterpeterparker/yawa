import type { AnalyticsSessionApiEnv } from "../types/api";
import { createMiddleware } from "hono/factory";
import { isEmptyString } from "yawa-common";
import { hashSessionId } from "../helpers/session-id";

export const buildSessionIdMiddleware = createMiddleware<AnalyticsSessionApiEnv>(
  async (context, next) => {
    const {
      req,
      var: {
        site: { id: site_id },
        ip,
      },
    } = context;

    const user_agent = req.header("User-Agent");

    const buildSessionId = () => {
      if (isEmptyString(ip) || isEmptyString(user_agent)) {
        return Bun.randomUUIDv7();
      }

      const sessionIdResult = hashSessionId({ site_id, ip, user_agent });

      if (sessionIdResult.status === "error") {
        return Bun.randomUUIDv7();
      }

      const {
        result: { sessionId },
      } = sessionIdResult;

      return sessionId;
    };

    context.set("sessionId", buildSessionId());

    await next();
  },
);
