import { DbInstance } from "./db/instance";
import { migrate } from "./migrate";

export * from "./db/instance";
export * from "./db/connection";
export * from "./open";
export * from "./queries/transactions/access-tokens";
export * from "./queries/transactions/sites";
export * from "./queries/transactions/additional-sites";
export * from "./queries/transactions/page-views";
export * from "./queries/transactions/track-events";
export * from "./queries/transactions/performance-metrics";
export * from "./queries/analytics/page-views";
export * from "./queries/analytics/track-events";
export * from "./queries/analytics/performance-metrics";
export * from "./queries/analytics/types";

// For test purposes ONLY!
export const __createDbInstanceForTest__ = async (): Promise<DbInstance> => {
  const instance = await DbInstance.create({ type: "in-memory" });
  await migrate({ instance });
  return instance;
};
