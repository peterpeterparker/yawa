import { describe, expect, test } from "bun:test";
import { Hono } from "hono";
import { defineHealth } from "../../src/app/_health";

describe("defineHealth", () => {
  const app = new Hono();
  app.get("/health", defineHealth);

  test("returns 200 with status ok", async () => {
    const res = await app.request("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });
});
