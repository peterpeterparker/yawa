import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import type { AnalyticsApiEnv } from "../../../src/app/types/api.ts";
import { extractIpMiddleware } from "../../../src/app/middlewares/ip";

const makeApp = () => {
  const app = new Hono<AnalyticsApiEnv>();
  app.use("*", extractIpMiddleware);
  app.get("/test", (c) => c.json({ ip: c.get("ip") }));
  return app;
};

describe("extractIpMiddleware", () => {
  test("extracts IP from x-forwarded-for", async () => {
    const app = makeApp();
    const res = await app.request("/test", {
      headers: { "x-forwarded-for": "192.0.2.1" },
    });
    const { ip } = (await res.json()) as { ip: string };
    expect(ip).toBe("192.0.2.1");
  });

  test("sets ip to undefined when no IP header present", async () => {
    const app = makeApp();
    const res = await app.request("/test");
    const { ip } = (await res.json()) as { ip: string | undefined };
    expect(ip).toBeUndefined();
  });
});
