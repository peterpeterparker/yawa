import type { DefineHandler } from "../types/api";
import { InternalSchema } from "yawa-schema/app";
import { DbSites } from "yawa-db";

export const defineCreateSite: DefineHandler<
  typeof InternalSchema.Site.CreateSiteRequestSchema
> = async (context) => {
  const {
    req,
    var: {
      db: { connection },
    },
  } = context;

  const { hostname } = req.valid("json");

  const result = await DbSites.create({ connection }).insert({ hostname });

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to create site" }, 500);
  }

  const {
    result: { id },
  } = result;

  return context.json({ id }, 201);
};
