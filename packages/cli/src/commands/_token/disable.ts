import { nextArg } from "../../utils/args";
import { assertNotEmptyString } from "yawa-common";
import { log } from "../../utils/log";
import { ENV } from "../../env";
import { exitWithResponse } from "../../utils/exit";

export const tokenDisable = async (args?: string[]) => {
  const id = nextArg({ args, option: "--id" });
  assertNotEmptyString(id, "--id");

  const response = await fetch(`${ENV.APP.INTERNAL_URL}/tokens/${id}`, {
    method: "PATCH",
  });

  if (!response.ok) {
    await exitWithResponse({
      response,
      msg: "Failed to disable token",
    });
  }

  log(`Token disabled (${id})`);
};
