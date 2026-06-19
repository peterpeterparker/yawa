import { describe, test, expect, afterEach, beforeEach, spyOn } from "bun:test";
import { initServices, setPageView, trackAsync, startTrackPerformance } from "../src/_tracker";
import { EventsService } from "../src/services/events.service";
import { PerformanceService } from "../src/services/performance.service";

const setupBrowser = () => {
  // @ts-ignore
  globalThis.window = {
    innerWidth: 1920,
    innerHeight: 1080,
    screen: { availWidth: 1920, availHeight: 1080 } as unknown as Screen,
    crypto: {
      randomUUID: () =>
        "00000000-0000-7000-8000-000000000000" as `${string}-${string}-${string}-${string}-${string}`,
    } as Crypto,
  };
  // @ts-ignore
  globalThis.document = {
    title: "Test Page",
    location: { href: "https://example.com/" } as unknown as Location,
  };
  // @ts-ignore
  globalThis.Intl = {
    DateTimeFormat: () => ({
      resolvedOptions: () =>
        ({ timeZone: "Europe/Zurich" }) as unknown as Intl.ResolvedDateTimeFormatOptions,
    }),
  } as unknown as typeof Intl;
};

describe("tracker", () => {
  let spySetPageView: ReturnType<typeof spyOn>;
  let spySetTrackEvent: ReturnType<typeof spyOn>;
  let spySetPerformanceMetric: ReturnType<typeof spyOn>;
  let spyStartPerformance: ReturnType<typeof spyOn>;

  beforeEach(() => {
    setupBrowser();

    spySetPageView = spyOn(EventsService.prototype, "setPageView").mockImplementation(
      async () => {},
    );
    spySetTrackEvent = spyOn(EventsService.prototype, "setTrackEvent").mockImplementation(
      async () => {},
    );
    spySetPerformanceMetric = spyOn(
      EventsService.prototype,
      "setPerformanceMetric",
    ).mockImplementation(async () => {});
    spyStartPerformance = spyOn(
      PerformanceService.prototype,
      "startPerformance",
    ).mockImplementation(async () => {});
  });

  afterEach(() => {
    spySetPageView?.mockRestore();
    spySetTrackEvent?.mockRestore();
    spySetPerformanceMetric?.mockRestore();
    spyStartPerformance?.mockRestore();
    // @ts-ignore
    globalThis.window = undefined;
  });

  describe("initServices", () => {
    test("cleanup nulls services", async () => {
      const { cleanup } = initServices({ serverUrl: "https://analytics.example.com" });
      cleanup();

      await setPageView();
      expect(EventsService.prototype.setPageView).not.toHaveBeenCalled();
    });

    test("does not initialize performance when not opted in", async () => {
      initServices({ serverUrl: "https://analytics.example.com" });

      await startTrackPerformance();
      expect(PerformanceService.prototype.startPerformance).not.toHaveBeenCalled();
    });

    test("initializes performance when opted in", async () => {
      initServices({ serverUrl: "https://analytics.example.com", webVitals: true });

      await startTrackPerformance();
      expect(PerformanceService.prototype.startPerformance).toHaveBeenCalled();
    });
  });

  describe("setPageView", () => {
    test("calls events.setPageView with correct shape", async () => {
      initServices({ serverUrl: "https://analytics.example.com" });

      await setPageView();

      expect(EventsService.prototype.setPageView).toHaveBeenCalledWith(
        expect.objectContaining({
          href: "https://example.com/",
          title: "Test Page",
          time_zone: "Europe/Zurich",
          device: expect.objectContaining({ inner_width: 1920, inner_height: 1080 }),
        }),
      );
    });

    test("includes referrer when document.referrer is set", async () => {
      // @ts-ignore
      globalThis.document.referrer = "https://twitter.com";
      initServices({ serverUrl: "https://analytics.example.com" });

      await setPageView();

      expect(EventsService.prototype.setPageView).toHaveBeenCalledWith(
        expect.objectContaining({ referrer: "https://twitter.com" }),
      );
    });

    test("omits referrer when document.referrer is empty", async () => {
      // @ts-ignore
      globalThis.document.referrer = "";
      initServices({ serverUrl: "https://analytics.example.com" });

      await setPageView();

      expect(EventsService.prototype.setPageView).toHaveBeenCalledWith(
        expect.not.objectContaining({ referrer: expect.anything() }),
      );
    });
  });

  describe("trackAsync", () => {
    test("calls events.setTrackEvent", async () => {
      initServices({ serverUrl: "https://analytics.example.com" });

      await trackAsync({ name: "button_click", metadata: { plan: "pro" } });

      expect(EventsService.prototype.setTrackEvent).toHaveBeenCalledWith(
        expect.objectContaining({ name: "button_click", metadata: { plan: "pro" } }),
      );
    });

    test("no-ops when not in browser", async () => {
      initServices({ serverUrl: "https://analytics.example.com" });
      // @ts-ignore
      globalThis.window = undefined;

      await trackAsync({ name: "button_click" });
      expect(EventsService.prototype.setTrackEvent).not.toHaveBeenCalled();
    });
  });
});
