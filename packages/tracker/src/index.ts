import type { Environment } from "./types/env";
import { initServices, initTrackPageViews, setPageView, startTrackPerformance } from "./_tracker";

export type * from "./types/env";
export type * from "./types/track";
export { track, trackAsync, visit, visitAsync } from "./_tracker";

/**
 * Initializes the yawa analytics tracker.
 *
 * Tracks the first page view immediately, listens for navigation changes (SPA-friendly),
 * and optionally collects Web Vitals.
 *
 * @param env - Configuration options including the server URL and optional features.
 * @returns A cleanup function to stop tracking and remove all listeners.
 *
 * @example
 * const cleanup = init({ serverUrl: "https://analytics.example.com" });
 * // Later, to stop tracking:
 * cleanup();
 */
export const init = (env: Environment): (() => void) => {
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
