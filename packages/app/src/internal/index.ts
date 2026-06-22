import { Hono } from "hono";
import type { DefineApi } from "../types/api";
import { zValidator } from "@hono/zod-validator";
import { defineCreateToken, defineDisableToken, defineListTokens } from "./_tokens";
import { InternalSchema } from "yawa-schema/app";
import { loadDbMiddleware } from "../middlewares/db";
import { defineCreateSite, defineListSites, defineUpdateSiteStatus } from "./_sites";

export const defineInternal: DefineApi = ({ db }) => {
  const app = new Hono();

  app.use("*", loadDbMiddleware({ db }));

  app.post(
    "/tokens",
    zValidator("json", InternalSchema.Token.CreateTokenRequestSchema),
    defineCreateToken,
  );
  app.get("/tokens", defineListTokens);
  app.patch("/tokens/:id", defineDisableToken);

  app.post(
    "/sites",
    zValidator("json", InternalSchema.Site.CreateSiteRequestSchema),
    defineCreateSite,
  );
  app.get("/sites", defineListSites);
  app.patch(
    "/sites/:id",
    zValidator("json", InternalSchema.Site.UpdateSiteStatusRequestSchema),
    defineUpdateSiteStatus,
  );

  return {
    fetch: app.fetch,
  };
};
