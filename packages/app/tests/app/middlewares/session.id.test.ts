import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { buildSessionIdMiddleware } from "../../../src/app/middlewares/session-id";
import type { AnalyticsSessionApiEnv } from "../../../src/app/types/api.ts";

const site = {
  id: "01912d4e-1234-7000-8000-000000000000",
  hostname: "example.com",
  status: "active" as const,
  created_at: "2026-01-01 00:00:00",
  updated_at: "2026-01-01 00:00:00",
};

const makeApp = (ip?: string) => {
  const app = new Hono<AnalyticsSessionApiEnv>();
  app.use("*", async (c, next) => {
    c.set("db", { connection: {} as never });
    c.set("site", site);
    c.set("ip", ip);
    await next();
  });
  app.use("*", buildSessionIdMiddleware);
  app.get("/test", (c) => c.json({ sessionId: c.get("sessionId") }));
  return app;
};

describe("buildSessionIdMiddleware", () => {
  test("returns deterministic session_id when ip and user_agent are present", async () => {
    const app = makeApp("192.0.2.1");
    const headers = { "User-Agent": "Mozilla/5.0 Chrome" };

    const res1 = await app.request("/test", { headers });
    const res2 = await app.request("/test", { headers });

    const { sessionId: id1 } = (await res1.json()) as { sessionId: string };
    const { sessionId: id2 } = (await res2.json()) as { sessionId: string };

    expect(id1).toBe(id2);
  });

  test("returns random session_id when ip is missing", async () => {
    const app = makeApp();

    const res1 = await app.request("/test", { headers: { "User-Agent": "Mozilla/5.0" } });
    const res2 = await app.request("/test", { headers: { "User-Agent": "Mozilla/5.0" } });

    const { sessionId: id1 } = (await res1.json()) as { sessionId: string };
    const { sessionId: id2 } = (await res2.json()) as { sessionId: string };

    expect(id1).not.toBe(id2);
  });

  test("returns random session_id when user_agent is missing", async () => {
    const app = makeApp("192.0.2.1");

    const res1 = await app.request("/test");
    const res2 = await app.request("/test");

    const { sessionId: id1 } = (await res1.json()) as { sessionId: string };
    const { sessionId: id2 } = (await res2.json()) as { sessionId: string };

    expect(id1).not.toBe(id2);
  });

  test("returns random session_id when secret is not set", async () => {
    delete process.env.YAWA_SESSION_SECRET;
    const app = makeApp("192.0.2.1");

    const res1 = await app.request("/test", { headers: { "User-Agent": "Mozilla/5.0" } });
    const res2 = await app.request("/test", { headers: { "User-Agent": "Mozilla/5.0" } });

    const { sessionId: id1 } = (await res1.json()) as { sessionId: string };
    const { sessionId: id2 } = (await res2.json()) as { sessionId: string };

    expect(id1).not.toBe(id2);
  });
});
