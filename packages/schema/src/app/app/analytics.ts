import { AnalyticsSchema } from "../../db";
import * as z from "zod";

const DeviceSchema = z.strictObject({
  inner_width: AnalyticsSchema.PageViewSchema.shape.device_inner_width,
  inner_height: AnalyticsSchema.PageViewSchema.shape.device_inner_height,
  screen_width: AnalyticsSchema.PageViewSchema.shape.device_screen_width.unwrap().optional(),
  screen_height: AnalyticsSchema.PageViewSchema.shape.device_screen_height.unwrap().optional(),
});

export const CreatePageViewRequestSchema = z.strictObject({
  visit_id: AnalyticsSchema.PageViewSchema.shape.visit_id,
  title: AnalyticsSchema.PageViewSchema.shape.title,
  href: AnalyticsSchema.PageViewSchema.shape.href,
  time_zone: AnalyticsSchema.PageViewSchema.shape.time_zone,
  referrer: AnalyticsSchema.PageViewSchema.shape.referrer.unwrap().optional(),
  device: DeviceSchema,
});

export const CreateTrackEventRequestSchema = z.strictObject({
  visit_id: AnalyticsSchema.TrackEventSchema.shape.visit_id,
  name: AnalyticsSchema.TrackEventSchema.shape.name,
  metadata: z
    .record(z.string().max(200), z.string().max(200))
    .refine((val) => Object.keys(val).length <= 10, {
      message: "Metadata cannot have more than 10 keys",
    })
    .optional(),
});

export const CreatePerformanceMetricRequestSchema = z.strictObject({
  visit_id: AnalyticsSchema.PerformanceMetricSchema.shape.visit_id,
  href: AnalyticsSchema.PerformanceMetricSchema.shape.href,
  metric_name: AnalyticsSchema.PerformanceMetricSchema.shape.metric_name,
  value: AnalyticsSchema.PerformanceMetricSchema.shape.value,
  delta: AnalyticsSchema.PerformanceMetricSchema.shape.delta,
  metric_id: AnalyticsSchema.PerformanceMetricSchema.shape.metric_id,
  navigation_type: AnalyticsSchema.PerformanceMetricSchema.shape.navigation_type.optional(),
});
