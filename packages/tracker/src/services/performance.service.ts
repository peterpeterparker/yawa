import type {
  NavigationType,
  PerformanceMetricName,
  SetPerformanceMetricRequest,
} from "../types/api";
import type { Metric } from "web-vitals";

type SessionMetric = Omit<Metric, "navigationType"> & Partial<Pick<Metric, "navigationType">>;

type SetPerformanceMetricRequestEntry = Omit<SetPerformanceMetricRequest, "visit_id">;

type PostPerformanceMetric = (entry: SetPerformanceMetricRequestEntry) => Promise<void>;

export class PerformanceService {
  async startPerformance({
    postPerformanceMetric,
  }: {
    postPerformanceMetric: PostPerformanceMetric;
  }) {
    const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import("web-vitals");

    const setMetric = (metric: Metric) => {
      (async () => {
        await PerformanceService.setPerformanceMetric({
          metric,
          postPerformanceMetric,
        });
      })();
    };

    onCLS(setMetric);
    onFCP(setMetric);
    onINP(setMetric);
    onLCP(setMetric);
    onTTFB(setMetric);
  }

  private static setPerformanceMetric = async ({
    metric,
    postPerformanceMetric,
  }: {
    metric: SessionMetric;
    postPerformanceMetric: PostPerformanceMetric;
  }) => {
    const data = PerformanceService.mapPerformanceMetric(metric);

    if (data === "unknown") {
      console.warn("Performance metric ignored. Unknown metric name.", metric);
      return;
    }

    await postPerformanceMetric(data);
  };

  private static mapPerformanceMetric({
    name: metricName,
    value,
    delta,
    id,
    navigationType,
  }: SessionMetric): SetPerformanceMetricRequestEntry | "unknown" {
    const mapMetricName = (): PerformanceMetricName | "unknown" => {
      switch (metricName) {
        case "CLS":
        case "FCP":
        case "INP":
        case "LCP":
        case "TTFB":
          return metricName;
        default:
          return "unknown";
      }
    };

    const metric_name = mapMetricName();

    if (metric_name === "unknown") {
      return metric_name;
    }

    const mapNavigationType = (): NavigationType | undefined => {
      switch (navigationType) {
        case "navigate":
          return "navigate";
        case "restore":
          return "restore";
        case "reload":
          return "reload";
        case "back-forward":
          return "back_forward";
        case "back-forward-cache":
          return "back_forward_cache";
        case "prerender":
          return "prerender";
        default:
          return undefined;
      }
    };

    const navigation_type = mapNavigationType();

    const {
      location: { href },
    } = document;

    const metric: SetPerformanceMetricRequestEntry = {
      href,
      metric_name,
      value,
      delta,
      metric_id: id,
      ...(navigation_type !== undefined && { navigation_type }),
    };

    return metric;
  }
}
