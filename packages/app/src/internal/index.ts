import { Hono } from "hono";
import type { DefineApi } from "../types/api";
import { zValidator } from "@hono/zod-validator";
import { defineCreateToken } from "./_token";
import { InternalSchema } from "yawa-schema/app";
import { loadDbMiddleware } from "../middlewares/db";
import { defineCreateSite } from "./_sites";

export const defineInternal: DefineApi = ({ db }) => {
  const app = new Hono();

  app.use("*", loadDbMiddleware({ db }));

  app.post(
    "/tokens",
    zValidator("json", InternalSchema.Token.CreateTokenRequestSchema),
    defineCreateToken,
  );

  app.post(
    "/sites",
    zValidator("json", InternalSchema.Site.CreateSiteRequestSchema),
    defineCreateSite,
  );

  return {
    fetch: app.fetch,
  };
};
