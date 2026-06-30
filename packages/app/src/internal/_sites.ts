import type { DefineHandler } from "../types/api";
import { InternalSchema } from "yawa-schema/app";
import { DbLinkedSites, DbSites } from "yawa-db";
import { isEmptyString, isNullish, nonNullish } from "yawa-common";

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

export const defineLinkSite: DefineHandler<
  typeof InternalSchema.Site.LinkSiteRequestSchema
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

  const { hostname } = req.valid("json");

  const sites = DbSites.create({ connection });

  const siteResult = await sites.findById({ id });

  if (siteResult.status === "error") {
    console.error(siteResult.err);
    return context.json({ error: "Failed to find site" }, 500);
  }

  const { result: site } = siteResult;

  if (isNullish(site)) {
    return context.json({ error: "Site not found" }, 404);
  }

  const existingResult = await sites.findByHostname({ hostname });

  if (existingResult.status === "error") {
    console.error(existingResult.err);
    return context.json({ error: "Failed to find site with hostname" }, 500);
  }

  const { result: existingSite } = existingResult;

  if (nonNullish(existingSite)) {
    return context.json({ error: "Hostname already in use as a site" }, 400);
  }

  const result = await DbLinkedSites.create({ connection }).insert({ site_id: id, hostname });

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to link hostname" }, 500);
  }

  const {
    result: { id: linkedId },
  } = result;

  return context.json({ id: linkedId }, 201);
};
