import { describe, test, expect, spyOn, beforeEach, afterEach } from "bun:test";
import { EventsService } from "../../src/services/events.service";
import { EventsApi } from "../../src/api/events.api";

describe("EventsService", () => {
  let service: EventsService;
  let spyPostPageViews: ReturnType<typeof spyOn>;
  let spyPostTrackEvents: ReturnType<typeof spyOn>;
  let spyPostPerformanceMetrics: ReturnType<typeof spyOn>;

  beforeEach(() => {
    // @ts-ignore
    globalThis.window = { crypto: { randomUUID: () => "test-visit-id" } };

    spyPostPageViews = spyOn(EventsApi.prototype, "postPageViews").mockImplementation(
      async () => {},
    );
    spyPostTrackEvents = spyOn(EventsApi.prototype, "postTrackEvents").mockImplementation(
      async () => {},
    );
    spyPostPerformanceMetrics = spyOn(
      EventsApi.prototype,
      "postPerformanceMetrics",
    ).mockImplementation(async () => {});

    service = new EventsService({ serverUrl: "https://analytics.example.com" });
  });

  afterEach(() => {
    spyPostPageViews?.mockRestore();
    spyPostTrackEvents?.mockRestore();
    spyPostPerformanceMetrics?.mockRestore();
    // @ts-ignore
    globalThis.window = undefined;
  });

  test("setPageView includes visit_id", async () => {
    await service.setPageView({
      title: "Home",
      href: "https://example.com/",
      time_zone: "Europe/Zurich",
      device: { inner_width: 1920, inner_height: 1080 },
    });

    expect(spyPostPageViews).toHaveBeenCalledWith({
      request: expect.objectContaining({ visit_id: "test-visit-id" }),
    });
  });

  test("setTrackEvent includes visit_id", async () => {
    await service.setTrackEvent({ name: "button_click" });

    expect(spyPostTrackEvents).toHaveBeenCalledWith({
      request: expect.objectContaining({ visit_id: "test-visit-id" }),
    });
  });

  test("setPerformanceMetric includes visit_id", async () => {
    await service.setPerformanceMetric({
      href: "https://example.com/",
      metric_name: "LCP",
      value: 1234.56,
      delta: 100.0,
      metric_id: "v3-1234567890-1",
    });

    expect(spyPostPerformanceMetrics).toHaveBeenCalledWith({
      request: expect.objectContaining({ visit_id: "test-visit-id" }),
    });
  });

  test("visit_id is consistent across calls", async () => {
    await service.setPageView({
      title: "Home",
      href: "https://example.com/",
      time_zone: "Europe/Zurich",
      device: { inner_width: 1920, inner_height: 1080 },
    });

    await service.setTrackEvent({ name: "click" });

    const pageViewCall = (
      spyPostPageViews.mock.calls as unknown as { request: { visit_id: string } }[][]
    )[0]?.[0];
    const trackEventCall = (
      spyPostTrackEvents.mock.calls as unknown as { request: { visit_id: string } }[][]
    )[0]?.[0];

    expect(pageViewCall?.request.visit_id).toBe(trackEventCall?.request.visit_id);
  });
});
