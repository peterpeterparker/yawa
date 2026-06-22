import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { defineTracker } from "../../src/app/_tracker";

describe("defineTracker", () => {
  const app = new Hono();
  app.get("/static/yawa.js", defineTracker);

  test("returns 200 with the loader script", async () => {
    const res = await app.request("http://localhost:3000/static/yawa.js");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/javascript; charset=utf-8");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");
    expect(res.headers.get("Cache-Control")).toBe("public, max-age=604800");

    const body = await res.text();
    expect(body).toBe(
      "import { init } from 'http://localhost:3000/static/yawa/dist/index.js';init({serverUrl:\"http://localhost:3000\"});",
    );
  });

  test("derives serverUrl from the request host", async () => {
    const res = await app.request("https://yetanotherwebanalytics.dev/static/yawa.js");

    const body = await res.text();
    expect(body).toContain('init({serverUrl:"https://yetanotherwebanalytics.dev"});');
  });

  test("uses x-forwarded-proto when behind a reverse proxy", async () => {
    const res = await app.request("http://analytics.fluster.io/static/yawa.js", {
      headers: {
        "x-forwarded-proto": "https",
      },
    });

    const body = await res.text();
    expect(body).toBe(
      "import { init } from 'https://analytics.fluster.io/static/yawa/dist/index.js';init({serverUrl:\"https://analytics.fluster.io\"});",
    );
  });

  test("falls back to request protocol when x-forwarded-proto is absent", async () => {
    const res = await app.request("http://localhost:3000/static/yawa.js");

    const body = await res.text();
    expect(body).toContain(
      "import { init } from 'http://localhost:3000/static/yawa/dist/index.js'",
    );
  });
});
