import { nextArg } from "../../utils/args";
import { assertNotEmptyString } from "yawa-common";
import { log } from "../../utils/log";
import { InternalSchema } from "yawa-schema/app";
import { ENV } from "../../env";
import { exitWithResponse } from "../../utils/exit";
import { AnalyticsSchema } from "yawa-schema/db";

export const siteUpdate = async (args?: string[]) => {
  const id = nextArg({ args, option: "--id" });
  assertNotEmptyString(id, "--id");

  const rawStatus = nextArg({ args, option: "--status" });
  assertNotEmptyString(rawStatus, "--status");

  const status = AnalyticsSchema.SiteStatusSchema.parse(rawStatus);

  const response = await fetch(`${ENV.APP.INTERNAL_URL}/sites/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: InternalSchema.Site.UpdateSiteStatusRequestCodec.decode({ status }),
  });

  if (!response.ok) {
    await exitWithResponse({
      response,
      msg: "Failed to update site",
    });
  }

  log(`Site updated (${id})`);
};
