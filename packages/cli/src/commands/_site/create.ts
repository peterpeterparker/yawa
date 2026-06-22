import { nextArg } from "../../utils/args.ts";
import { assertNotEmptyString } from "yawa-common";
import { log } from "../../utils/log.ts";
import { InternalSchema } from "yawa-schema/app";
import { ENV } from "../../env.ts";
import { exitWithResponse } from "../../utils/exit.ts";

export const siteCreate = async (args?: string[]) => {
  const hostname = nextArg({ args, option: "--hostname" });

  assertNotEmptyString(hostname, "--hostname");

  const response = await fetch(`${ENV.APP.INTERNAL_URL}/sites`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: InternalSchema.Site.CreateSiteRequestCodec.decode({ hostname }),
  });

  if (!response.ok) {
    await exitWithResponse({
      response,
      msg: "Failed to create site",
    });
  }

  const { id } = InternalSchema.Site.CreateSiteResponseSchema.parse(await response.json());

  log(`Site registered: ${hostname} (${id})`);
};
