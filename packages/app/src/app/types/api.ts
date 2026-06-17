import type { Analytics } from "yawa-schema/db";
import type { OptionIp } from "./ip";
import type { ApiEnv } from "../../types/api";

export type AnalyticsApiEnv = {
  Variables: ApiEnv["Variables"] & { site: Analytics["Site"]; ip: OptionIp };
};

export type AnalyticsSessionApiEnv = {
  Variables: AnalyticsApiEnv["Variables"] & { sessionId: Analytics["SessionId"] };
};
