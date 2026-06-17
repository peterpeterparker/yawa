export interface SetRequest {
  visit_id: string;
}

// ---------------------------------------------------------
// Page views
// ---------------------------------------------------------

export interface SetPageViewDeviceRequest {
  inner_height: number;
  inner_width: number;
  screen_height?: number;
  screen_width?: number;
}

export interface SetPageViewRequest extends SetRequest {
  title: string;
  href: string;
  time_zone: string;
  device: SetPageViewDeviceRequest;
}

// ---------------------------------------------------------
// Track events
// ---------------------------------------------------------

export interface SetTrackEventRequest extends SetRequest {
  name: string;
  metadata?: Record<string, string>;
}

// ---------------------------------------------------------
// Performance Metrics
// ---------------------------------------------------------

export type PerformanceMetricName = "CLS" | "FCP" | "INP" | "LCP" | "TTFB";

export type NavigationType =
  | "navigate"
  | "reload"
  | "back_forward"
  | "back_forward_cache"
  | "prerender"
  | "restore";

export interface SetPerformanceMetricRequest extends SetRequest {
  href: string;
  metric_name: PerformanceMetricName;
  value: number;
  delta: number;
  metric_id: string;
  navigation_type?: NavigationType;
}
