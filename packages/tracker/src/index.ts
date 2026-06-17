import type { Environment } from "./types/env";
import { initServices, initTrackPageViews, setPageView, startTrackPerformance } from "./_tracker";

export type * from "./types/env";
export type * from "./types/track";
export { trackEvent, trackEventAsync, trackPageView, trackPageViewAsync } from "./_tracker";

export const initAnalytics = (env: Environment): (() => void) => {
  const { cleanup: analyticsServicesCleanup } = initServices(env);

  // Save first page as soon as possible.
  // We do not await on purpose to not block the application's boot.
  setPageView();

  const { cleanup: pushHistoryCleanup } = initTrackPageViews();

  // We do not await on purpose to not block the application's boot.
  startTrackPerformance();

  return () => {
    analyticsServicesCleanup();
    pushHistoryCleanup();
  };
};
