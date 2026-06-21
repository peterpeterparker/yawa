import type { DefineHandler } from "../types/api";
import { InternalSchema } from "yawa-schema/app";
import { DbSites } from "yawa-db";
import { isEmptyString } from "yawa-common";

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

export const defineUpdateSiteStatus: DefineHandler<
  typeof InternalSchema.Site.UpdateSiteStatusRequestSchema
> = async (context) => {
  const {
    req,
    var: {
      db: { connection },
    },
  } = context;

  const id = req.param("id");

  if (isEmptyString(id)) {
    return context.json({ error: "Bad Request" }, 400);
  }

  const { status } = req.valid("json");

  const result = await DbSites.create({ connection }).updateStatus({ id, status });

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to update site status" }, 500);
  }

  return context.newResponse(null, 204);
};

export const defineListSites: DefineHandler<never> = async (context) => {
  const {
    var: {
      db: { connection },
    },
  } = context;

  const result = await DbSites.create({ connection }).findAll();

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to list sites" }, 500);
  }

  const { result: sites } = result;

  return context.json({ sites });
};
