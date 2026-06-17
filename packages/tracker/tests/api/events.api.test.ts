import { describe, test, expect, mock, beforeEach } from "bun:test";
import { ApiError, EventsApi } from "../../src/api/events.api";

describe("EventsApi", () => {
  const mockFetch = mock(
    async (_url: string, _options: RequestInit) => new Response(null, { status: 204 }),
  );

  globalThis.fetch = mockFetch as unknown as typeof fetch;

  const api = new EventsApi({ serverUrl: "https://analytics.example.com" });

  const pageViewRequest = {
    visit_id: Bun.randomUUIDv7(),
    title: "Home",
    href: "https://example.com/",
    time_zone: "Europe/Zurich",
    device: { inner_width: 1920, inner_height: 1080 },
  };

  const trackEventRequest = {
    visit_id: Bun.randomUUIDv7(),
    name: "button_click",
    metadata: { plan: "pro" },
  };

  const performanceMetricRequest = {
    visit_id: Bun.randomUUIDv7(),
    href: "https://example.com/",
    metric_name: "LCP" as const,
    value: 1234.56,
    delta: 100.0,
    metric_id: "v3-1234567890-1",
  };

  beforeEach(() => {
    mockFetch.mockRestore();
    mockFetch.mockImplementation(async () => new Response(null, { status: 204 }));
  });

  describe("postPageViews", () => {
    test("posts to /events/view", async () => {
      await api.postPageViews({ request: pageViewRequest });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://analytics.example.com/events/view",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(pageViewRequest),
        }),
      );
    });

    test("throws ApiError on non-ok response", async () => {
      mockFetch.mockImplementation(
        async () => new Response(null, { status: 400, statusText: "Bad Request" }),
      );

      expect(api.postPageViews({ request: pageViewRequest })).rejects.toThrow(ApiError);
    });
  });

  describe("postTrackEvents", () => {
    test("posts to /events/track", async () => {
      await api.postTrackEvents({ request: trackEventRequest });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://analytics.example.com/events/track",
        expect.objectContaining({ method: "POST" }),
      );
    });

    test("throws ApiError on non-ok response", async () => {
      mockFetch.mockImplementation(
        async () => new Response(null, { status: 500, statusText: "Internal Server Error" }),
      );

      expect(api.postTrackEvents({ request: trackEventRequest })).rejects.toThrow(ApiError);
    });
  });

  describe("postPerformanceMetrics", () => {
    test("posts to /events/metric", async () => {
      await api.postPerformanceMetrics({ request: performanceMetricRequest });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://analytics.example.com/events/metric",
        expect.objectContaining({ method: "POST" }),
      );
    });

    test("throws ApiError on non-ok response", async () => {
      mockFetch.mockImplementation(
        async () => new Response(null, { status: 403, statusText: "Forbidden" }),
      );

      expect(api.postPerformanceMetrics({ request: performanceMetricRequest })).rejects.toThrow(
        ApiError,
      );
    });
  });

  describe("ApiError", () => {
    test("formats message correctly", () => {
      const err = new ApiError(404, "Not Found");
      expect(err.message).toBe("[404] Analytics error: Not Found");
    });
  });
});
