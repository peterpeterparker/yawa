import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { defineTracker } from "../../src/app/_tracker.ts";

describe("defineTracker", () => {
  const app = new Hono();
  app.get("/tracker", defineTracker);

  test("returns 200 with the loader script", async () => {
    const res = await app.request("http://localhost:3000/tracker");

    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/javascript; charset=utf-8");
    expect(res.headers.get("x-content-type-options")).toBe("nosniff");

    const body = await res.text();
    expect(body).toBe(
      "import { init } from 'http://localhost:3000/tracker/dist/index.js';init({serverUrl:\"http://localhost:3000\"});",
    );
  });

  test("derives serverUrl from the request host", async () => {
    const res = await app.request("https://yetanotherwebanalytics.dev/tracker");

    const body = await res.text();
    expect(body).toContain('init({serverUrl:"https://yetanotherwebanalytics.dev"});');
  });
});
