import * as z from "zod";

export const TopEventsSchema = z.strictObject({
  name: z.string(),
  count: z.coerce.number(),
  visitors: z.coerce.number(),
});

export const ListTopEventsSchema = z.array(TopEventsSchema);

export const EventSeriesSchema = z.strictObject({
  date: z.string(),
  name: z.string(),
  count: z.coerce.number(),
});

export const ListEventSeriesSchema = z.array(EventSeriesSchema);
