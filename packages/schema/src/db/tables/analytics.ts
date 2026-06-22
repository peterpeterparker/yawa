import * as z from "zod";
import { IdSchema, TimestampSchema } from "./common";

export const SiteStatusSchema = z.enum(["active", "disabled", "archived"]);

export const SiteSchema = z.strictObject({
  id: IdSchema,
  hostname: z.hostname(),
  status: SiteStatusSchema,
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
});

export const SiteMetadataSchema = SiteSchema.pick({ id: true, hostname: true, status: true });

export const SessionIdSchema = z.uuid();

export const VisitIdSchema = z.uuid();

export const PageViewSchema = z.strictObject({
  id: IdSchema,
  site_id: IdSchema,
  session_id: SessionIdSchema,
  visit_id: VisitIdSchema,
  title: z.string(),
  href: z.string(),
  referrer: z.string().nullable(),
  time_zone: z.string(),
  language: z.string().nullable(),
  user_agent: z.string().nullable(),
  device_inner_width: z.number().int().nonnegative(),
  device_inner_height: z.number().int().nonnegative(),
  device_screen_width: z.number().int().nonnegative().nullable(),
  device_screen_height: z.number().int().nonnegative().nullable(),
  client_browser: z.string().nullable(),
  client_operating_system: z.string().nullable(),
  client_device: z.string().nullable(),
  campaign_utm_source: z.string().nullable(),
  campaign_utm_medium: z.string().nullable(),
  campaign_utm_campaign: z.string().nullable(),
  campaign_utm_term: z.string().nullable(),
  campaign_utm_content: z.string().nullable(),
  created_at: TimestampSchema,
});

export const TrackEventSchema = z.strictObject({
  id: IdSchema,
  site_id: IdSchema,
  session_id: SessionIdSchema,
  visit_id: VisitIdSchema,
  name: z.string(),
  metadata: z.record(z.string(), z.string()).nullable(),
  created_at: TimestampSchema,
});

export const PerformanceMetricNameSchema = z.enum(["CLS", "FCP", "INP", "LCP", "TTFB"]);

export const NavigationTypeSchema = z.enum([
  "navigate",
  "reload",
  "back_forward",
  "back_forward_cache",
  "prerender",
  "restore",
]);

export const PerformanceMetricSchema = z.strictObject({
  id: IdSchema,
  site_id: IdSchema,
  session_id: SessionIdSchema,
  visit_id: VisitIdSchema,
  href: z.string(),
  metric_name: PerformanceMetricNameSchema,
  value: z.number(),
  delta: z.number(),
  metric_id: z.string(),
  navigation_type: NavigationTypeSchema.nullable(),
  created_at: TimestampSchema,
});
