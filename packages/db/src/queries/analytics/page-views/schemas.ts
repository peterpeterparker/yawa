import * as z from "zod";

export const StatsSchema = z.strictObject({
  pageviews: z.coerce.number(),
  visitors: z.coerce.number(),
  visits: z.coerce.number(),
  bounces: z.coerce.number(),
});

export const OptionStatsSchema = StatsSchema.optional();

export const ExpandedSchema = z.strictObject({
  name: z.string(),
  pageviews: z.coerce.number(),
  visitors: z.coerce.number(),
  visits: z.coerce.number(),
  bounces: z.coerce.number(),
  totaltime: z.coerce.number(),
});

export const ListExpandedSchema = z.array(ExpandedSchema);

export const MetricSchema = z.strictObject({
  name: z.string(),
  visitors: z.coerce.number(),
});

export const ListMetricSchema = z.array(MetricSchema);

export const SeriesSchema = z.strictObject({
  date: z.string(),
  pageviews: z.coerce.number(),
  visitors: z.coerce.number(),
});

export const ListSeriesSchema = z.array(SeriesSchema);

export const HourSchema = z.strictObject({
  hour: z.coerce.number(),
  pageviews: z.coerce.number(),
  visitors: z.coerce.number(),
});

export const ListHourSchema = z.array(HourSchema);

export const PageSchema = z.strictObject({
  href: z.string(),
  visitors: z.coerce.number(),
  pageviews: z.coerce.number(),
});

export const ListPageSchema = z.array(PageSchema);

export const TitleSchema = z.strictObject({
  name: z.string(),
  visitors: z.coerce.number(),
  pageviews: z.coerce.number(),
});

export const ListTitleSchema = z.array(TitleSchema);
