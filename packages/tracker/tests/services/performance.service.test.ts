import { describe, test, expect, beforeEach } from "bun:test";
import { PerformanceService } from "../../src/services/performance.service";

const makeMetric = (overrides = {}) => ({
  name: "LCP" as const,
  value: 1234.56,
  delta: 100.0,
  id: "v3-1234567890-1",
  rating: "good" as const,
  entries: [],
  navigationType: "navigate" as const,
  ...overrides,
});

describe("PerformanceService.mapPerformanceMetric", () => {
  beforeEach(() => {
    // @ts-ignore
    globalThis.document = { location: { href: "https://example.com/" } };
  });

  describe("metric name mapping", () => {
    test.each(["CLS", "FCP", "INP", "LCP", "TTFB"] as const)("maps %s correctly", async (name) => {
      const post = async (entry: unknown) => {
        result = entry;
      };
      let result: unknown;

      // @ts-ignore — access private static via any
      await (PerformanceService as any).setPerformanceMetric({
        metric: makeMetric({ name }),
        postPerformanceMetric: post,
      });

      expect((result as any)?.metric_name).toBe(name);
    });

    test("returns unknown for unrecognized metric name", async () => {
      let called = false;

      // @ts-ignore
      await (PerformanceService as any).setPerformanceMetric({
        metric: makeMetric({ name: "UNKNOWN" }),
        postPerformanceMetric: async () => {
          called = true;
        },
      });

      expect(called).toBe(false);
    });
  });

  describe("navigation type mapping", () => {
    test.each([
      ["navigate", "navigate"],
      ["reload", "reload"],
      ["restore", "restore"],
      ["back-forward", "back_forward"],
      ["back-forward-cache", "back_forward_cache"],
      ["prerender", "prerender"],
    ] as const)("maps %s to %s", async (input, expected) => {
      let result: unknown;

      // @ts-ignore
      await (PerformanceService as any).setPerformanceMetric({
        metric: makeMetric({ navigationType: input }),
        postPerformanceMetric: async (entry: unknown) => {
          result = entry;
        },
      });

      expect((result as any)?.navigation_type).toBe(expected);
    });

    test("omits navigation_type when undefined", async () => {
      let result: unknown;

      // @ts-ignore
      await (PerformanceService as any).setPerformanceMetric({
        metric: makeMetric({ navigationType: undefined }),
        postPerformanceMetric: async (entry: unknown) => {
          result = entry;
        },
      });

      expect(result as any).not.toHaveProperty("navigation_type");
    });
  });

  describe("request shape", () => {
    test("maps metric fields correctly", async () => {
      let result: unknown;

      // @ts-ignore
      await (PerformanceService as any).setPerformanceMetric({
        metric: makeMetric(),
        postPerformanceMetric: async (entry: unknown) => {
          result = entry;
        },
      });

      expect(result).toEqual({
        href: "https://example.com/",
        metric_name: "LCP",
        value: 1234.56,
        delta: 100.0,
        metric_id: "v3-1234567890-1",
        navigation_type: "navigate",
      });
    });
  });
});
