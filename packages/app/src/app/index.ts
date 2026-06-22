import { Hono } from "hono";
import type { DefineApi } from "../types/api";
import { loadDbMiddleware } from "../middlewares/db";
import { zValidator } from "@hono/zod-validator";
import { AppSchema } from "yawa-schema/app";
import { defineCreatePageView } from "./_page-views";
import { loadSiteMiddleware } from "./middlewares/site";
import { cors } from "hono/cors";
import { extractIpMiddleware } from "./middlewares/ip";
import { buildSessionIdMiddleware } from "./middlewares/session-id";
import { assertAuthMiddleware } from "../middlewares/auth";
import { defineMcp } from "./_mcp";
import { defineCreateTrackEvent } from "./_track-events";
import { defineCreatePerformanceMetric } from "./_performance-metrics";
import { defineHealth } from "./_health";
import { defineTracker } from "./_tracker";
import { serveStatic } from "hono/bun";
import { join } from "node:path";

export const defineApp: DefineApi = ({ db }) => {
  const app = new Hono();

  app.use("*", loadDbMiddleware({ db }));

  app.use(
    "/events/*",
    cors({
      allowMethods: ["POST"],
    }),
  );
  app.use("/static/yawa.js", cors({ allowMethods: ["GET"] }));
  app.use(
    "/static/yawa/*",
    cors({
      allowMethods: ["GET"],
    }),
  );

  app.use("/events/*", loadSiteMiddleware);
  app.use("/events/*", extractIpMiddleware);
  app.use("/events/*", buildSessionIdMiddleware);

  app.use("/mcp/*", assertAuthMiddleware);

  app.post(
    "/events/view",
    zValidator("json", AppSchema.Analytics.CreatePageViewRequestSchema),
    defineCreatePageView,
  );
  app.post(
    "/events/track",
    zValidator("json", AppSchema.Analytics.CreateTrackEventRequestSchema),
    defineCreateTrackEvent,
  );
  app.post(
    "/events/metric",
    zValidator("json", AppSchema.Analytics.CreatePerformanceMetricRequestSchema),
    defineCreatePerformanceMetric,
  );

  app.all("/mcp", defineMcp);

  app.get("/static/yawa.js", defineTracker);

  app.get(
    "/static/yawa/dist/*",
    serveStatic({
      root: join(process.env.NODE_ENV === "production" ? "." : "..", "tracker", "dist"),
      rewriteRequestPath: (path) => path.replace(/^\/static\/yawa\/dist/, ""),
      precompressed: true,
      onFound: (_path, context) => {
        context.header("Cache-Control", `public, immutable, max-age=604800`);
      },
    }),
  );

  app.get("/health", defineHealth);

  return {
    fetch: app.fetch,
  };
};
