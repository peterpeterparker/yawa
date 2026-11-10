import { describe, expect, test, beforeAll, afterAll } from "bun:test";
import type { Hono } from "hono";
import { __createDbInstanceForTest__, DbInstance } from "yawa-db";
import { defineApp } from "../../src/app";

describe("defineApp", () => {
  let instance: DbInstance;
  let fetch: Hono["fetch"];

  beforeAll(async () => {
    instance = await __createDbInstanceForTest__();
    ({ fetch } = defineApp({ db: instance }));
  });

  afterAll(async () => {
    await instance.close();
  });

  describe("secure headers", () => {
    test("sets HSTS without includeSubDomains", async () => {
      const res = await fetch(new Request("http://localhost:3000/health"));

      expect(res.status).toBe(200);
      expect(res.headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
    });

    test("sets default secure headers", async () => {
      const res = await fetch(new Request("http://localhost:3000/health"));

      expect(res.headers.get("X-Content-Type-Options")).toBe("nosniff");
      expect(res.headers.get("X-Frame-Options")).toBe("SAMEORIGIN");
      expect(res.headers.get("Referrer-Policy")).toBe("no-referrer");
    });

    test("keeps CORS headers on events preflight", async () => {
      const res = await fetch(
        new Request("http://localhost:3000/events/view", {
          method: "OPTIONS",
          headers: {
            Origin: "https://example.com",
            "Access-Control-Request-Method": "POST",
          },
        }),
      );

      expect(res.headers.get("Access-Control-Allow-Origin")).toBe("*");
      expect(res.headers.get("Strict-Transport-Security")).toBe("max-age=31536000");
    });
  });
});
