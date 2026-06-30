import type { InternalSchema, CommonSchema, AppSchema } from "./_schemas";
import type { z } from "zod";
import { ListLinkedSitesResponseSchema } from "./internal/site";

interface Internal {
  Token: {
    CreateTokenRequest: z.infer<typeof InternalSchema.Token.CreateTokenRequestSchema>;
    CreateTokenRResponse: z.infer<typeof InternalSchema.Token.CreateTokenResponseSchema>;
  };
  Site: {
    CreateSiteRequest: z.infer<typeof InternalSchema.Site.CreateSiteRequestSchema>;
    CreateSiteResponse: z.infer<typeof InternalSchema.Site.CreateSiteResponseSchema>;
    ListSitesResponse: z.infer<typeof InternalSchema.Site.ListSitesResponseSchema>;
    ListLinkedSitesResponse: z.infer<typeof InternalSchema.Site.ListLinkedSitesResponseSchema>;
  };
}

interface Common {
  Error: z.infer<typeof CommonSchema.Error.ErrorSchema>;
}

interface App {
  Analytics: {
    CreatePageViewRequestSchema: z.infer<typeof AppSchema.Analytics.CreatePageViewRequestSchema>;
  };
}

export type { Internal, Common, App };
