import type { ApiEnv, DefineApi } from "../types/api";
import { loadDbMiddleware } from "../middlewares/db";
import { pageViewRoute, defineCreatePageView } from "./_page-views";
import { loadSiteMiddleware } from "./middlewares/site";
import { cors } from "hono/cors";
import { extractIpMiddleware } from "./middlewares/ip";
import { buildSessionIdMiddleware } from "./middlewares/session-id";
import { assertAuthMiddleware } from "../middlewares/auth";
import { defineMcp } from "./_mcp";
import { trackEventRoute, defineCreateTrackEvent } from "./_track-events";
import { performanceMetricRoute, defineCreatePerformanceMetric } from "./_performance-metrics";
import { defineHealth, healthRoute } from "./_health";
import { defineTracker } from "./_tracker";
import { serveStatic } from "hono/bun";
import { join } from "node:path";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { AnalyticsSessionApiEnv } from "./types/api";
import { version, name as title } from "../../package.json";
import { swaggerUI } from "@hono/swagger-ui";

export const defineApp: DefineApi = ({ db }) => {
  const app = new OpenAPIHono<ApiEnv>();

  app.use("*", loadDbMiddleware({ db }));

  // Sub-app for events have a specific environment loaded with additional middlewares
  const eventsApp = new OpenAPIHono<AnalyticsSessionApiEnv>();

  eventsApp.use(
    "*",
    cors({
      allowMethods: ["POST"],
    }),
  );

  eventsApp.use("*", loadSiteMiddleware);
  eventsApp.use("*", extractIpMiddleware);
  eventsApp.use("*", buildSessionIdMiddleware);

  app.use("/mcp/*", assertAuthMiddleware);

  app.use("/static/yawa.js", cors({ allowMethods: ["GET"] }));
  app.use(
    "/static/yawa/*",
    cors({
      allowMethods: ["GET"],
    }),
  );

  eventsApp.openapi(pageViewRoute, defineCreatePageView);
  eventsApp.openapi(trackEventRoute, defineCreateTrackEvent);
  eventsApp.openapi(performanceMetricRoute, defineCreatePerformanceMetric);

  app.route("/events", eventsApp);

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

  app.openapi(healthRoute, defineHealth);

  app.doc("/doc", {
    openapi: "3.0.0",
    info: {
      version,
      title,
    },
  });

  app.get("/swagger", swaggerUI({ url: "/doc" }));

  return {
    fetch: app.fetch,
  };
};
