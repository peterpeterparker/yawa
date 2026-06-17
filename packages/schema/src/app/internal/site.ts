import * as z from "zod";
import { AnalyticsSchema } from "../../db";

export const CreateSiteRequestSchema = AnalyticsSchema.SiteSchema.pick({ hostname: true });

export const CreateSiteRequestCodec = z.codec(CreateSiteRequestSchema, z.string(), {
  decode: (args) => JSON.stringify(args),
  encode: (json) => JSON.parse(json),
});

export const CreateSiteResponseSchema = AnalyticsSchema.SiteSchema.pick({ id: true });
