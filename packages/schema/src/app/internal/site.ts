import * as z from "zod";
import { AnalyticsSchema } from "../../db";

export const CreateSiteRequestSchema = AnalyticsSchema.SiteSchema.pick({ hostname: true });

export const CreateSiteRequestCodec = z.codec(CreateSiteRequestSchema, z.string(), {
  decode: (args) => JSON.stringify(args),
  encode: (json) => JSON.parse(json),
});

export const CreateSiteResponseSchema = AnalyticsSchema.SiteSchema.pick({ id: true });

export const UpdateSiteStatusRequestSchema = AnalyticsSchema.SiteSchema.pick({
  status: true,
});

export const UpdateSiteStatusRequestCodec = z.codec(UpdateSiteStatusRequestSchema, z.string(), {
  decode: (args) => JSON.stringify(args),
  encode: (json) => JSON.parse(json),
});

export const ListSitesResponseSchema = z.strictObject({
  sites: z.array(AnalyticsSchema.SiteMetadataSchema),
});

export const ListLinkedSitesResponseSchema = z.strictObject({
  linkedSites: z.array(AnalyticsSchema.LinkedSiteSchema),
});

export const LinkSiteRequestSchema = AnalyticsSchema.LinkedSiteSchema.pick({
  hostname: true,
});

export const LinkSiteRequestCodec = z.codec(LinkSiteRequestSchema, z.string(), {
  decode: (args) => JSON.stringify(args),
  encode: (json) => JSON.parse(json),
});

export const LinkSiteResponseSchema = AnalyticsSchema.LinkedSiteSchema.pick({ id: true });
