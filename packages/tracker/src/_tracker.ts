import type { Environment } from "./types/env";
import { PerformanceService } from "./services/performance.service";
import { isBrowser } from "./utils/env.utils";
import { EventsService } from "./services/events.service";
import { warningServicesNotInitialized } from "./utils/log.utils";
import type { SetPerformanceMetricRequest } from "./types/api";
import type { TrackEvent } from "./types/track";

let services: Services | undefined | null;

interface Services {
  events: EventsService;
  /**
   * Developer opt-in feature.
   */
  performance: PerformanceService | null;
}

export const initServices = (env: Environment): { cleanup: () => void } => {
  services = {
    events: new EventsService(env),
    performance: env?.webVitals === true ? new PerformanceService() : null,
  };

  return {
    cleanup() {
      services = null;
    },
  };
};

export const initTrackPageViews = (): { cleanup: () => void } => {
  const trackPages = async () => await trackPageViewAsync();

  let pushStateProxy: typeof history.pushState | null = new Proxy(history.pushState, {
    // eslint-disable-next-line local-rules/prefer-object-params
    apply: async (
      target,
      thisArg,
      argArray: [data: unknown, unused: string, url?: string | URL | null | undefined],
    ) => {
      target.apply(thisArg, argArray);
      await trackPages();
    },
  });

  history.pushState = pushStateProxy;

  addEventListener("popstate", trackPages, { passive: true });

  return {
    cleanup() {
      pushStateProxy = null;
      removeEventListener("popstate", trackPages, false);
    },
  };
};

export const setPageView = async () => {
  if (!isBrowser()) {
    return;
  }

  const {
    title,
    location: { href },
  } = document;
  const { innerWidth, innerHeight, screen: windowScreen } = window;
  const { timeZone } = Intl.DateTimeFormat().resolvedOptions();

  warningServicesNotInitialized(services);

  await services?.events?.setPageView({
    href,
    time_zone: timeZone,
    title,
    device: {
      inner_width: innerWidth,
      inner_height: innerHeight,
      screen_width: windowScreen?.availWidth,
      screen_height: windowScreen?.availHeight,
    },
  });
};

export const startTrackPerformance = async () => {
  if (!isBrowser()) {
    return;
  }

  if (services?.performance === undefined || services?.performance === null) {
    return;
  }

  warningServicesNotInitialized(services);

  const postPerformanceMetric = async (entry: Omit<SetPerformanceMetricRequest, "visit_id">) => {
    warningServicesNotInitialized(services);

    await services?.events?.setPerformanceMetric(entry);
  };

  await services?.performance?.startPerformance({ postPerformanceMetric });
};

/**
 * Tracks a page view.
 *
 * This function does not return a promise, as it triggers the tracking request without awaiting its completion.
 * It is designed for fire-and-forget usage to avoid blocking application flow.
 */
export const trackPageView = () => {
  trackPageViewAsync();
};

/**
 * Tracks a page view.
 * @returns {Promise<void>} A promise that resolves when the page view is tracked.
 */
export const trackPageViewAsync = async (): Promise<void> => {
  await setPageView();
};

/**
 * Tracks a custom event.
 *
 * This function does not return a promise, as it triggers the tracking request without awaiting its completion.
 * It is designed for fire-and-forget usage to avoid blocking application flow.
 *
 * @param {TrackEvent} data - The event details.
 */
export const trackEvent = (data: TrackEvent) => {
  trackEventAsync(data);
};

/**
 * Tracks a custom event.
 * @param {TrackEvent} data - The event details.
 * @returns {Promise<void>} A promise that resolves when the event is tracked.
 */
export const trackEventAsync = async (data: TrackEvent): Promise<void> => {
  if (!isBrowser()) {
    return;
  }

  warningServicesNotInitialized(services);

  await services?.events?.setTrackEvent(data);
};
