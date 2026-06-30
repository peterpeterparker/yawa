import type { AdminSchema, SystemSchema, CommonSchema, AnalyticsSchema } from "./_schemas";
import type { z } from "zod";
import { AdditionalSiteSchema } from "./tables/analytics";

interface Admin {
  AccessToken: z.infer<typeof AdminSchema.AccessTokenSchema>;
}

interface System {
  Migration: z.infer<typeof SystemSchema.MigrationSchema>;
}

interface Common {
  Id: z.infer<typeof CommonSchema.IdSchema>;
  TimestampTZ: z.infer<typeof CommonSchema.TimestampSchema>;
}

interface Analytics {
  Site: z.infer<typeof AnalyticsSchema.SiteSchema>;
  AdditionalSite: z.infer<typeof AnalyticsSchema.AdditionalSiteSchema>;
  SessionId: z.infer<typeof AnalyticsSchema.SessionIdSchema>;
  PageView: z.infer<typeof AnalyticsSchema.PageViewSchema>;
  TrackEvent: z.infer<typeof AnalyticsSchema.TrackEventSchema>;
  PerformanceMetric: z.infer<typeof AnalyticsSchema.PerformanceMetricSchema>;
}

export type { Admin, Common, System, Analytics };
