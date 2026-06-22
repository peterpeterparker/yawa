import { nextArg } from "../../utils/args.ts";
import { assertNotEmptyString } from "yawa-common";
import { log } from "../../utils/log.ts";
import { InternalSchema } from "yawa-schema/app";
import { ENV } from "../../env.ts";
import { exitWithResponse } from "../../utils/exit.ts";

export const tokenCreate = async (args?: string[]) => {
  const name = nextArg({ args, option: "--name" });
  const expiresAt = nextArg({ args, option: "--expires" });

  assertNotEmptyString(name, "--name");

  const response = await fetch(`${ENV.APP.INTERNAL_URL}/tokens`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: InternalSchema.Token.CreateTokenRequestCodec.decode({
      name,
      expires_at: expiresAt ?? undefined,
    }),
  });

  if (!response.ok) {
    await exitWithResponse({
      response,
      msg: "Failed to create token",
    });
  }

  const { token } = InternalSchema.Token.CreateTokenResponseSchema.parse(await response.json());

  log(`Access token created for "${name}":`);
  log(`\n  ${token}\n`);
  log(`⚠️  Save this token as it won't be shown again.`);
};
