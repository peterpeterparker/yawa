import { nextArg } from "../../utils/args";
import { assertNotEmptyString } from "yawa-common";
import { log } from "../../utils/log";
import { InternalSchema } from "yawa-schema/app";
import { ENV } from "../../env";
import { exitWithResponse } from "../../utils/exit";

export const siteLink = async (args?: string[]) => {
  const id = nextArg({ args, option: "--id" });
  const hostname = nextArg({ args, option: "--hostname" });

  assertNotEmptyString(id, "--id");
  assertNotEmptyString(hostname, "--hostname");

  const response = await fetch(`${ENV.APP.INTERNAL_URL}/sites/${id}/link`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: InternalSchema.Site.LinkSiteRequestCodec.decode({ hostname }),
  });

  if (!response.ok) {
    await exitWithResponse({
      response,
      msg: "Failed to link hostname",
    });
  }

  const { id: linkedId } = InternalSchema.Site.LinkSiteResponseSchema.parse(await response.json());

  log(`Hostname linked: ${hostname} (${linkedId}) -> site ${id}`);
};
