import { isEmptyString, notEmptyString } from "yawa-common";
import { error, log } from "./utils/log";
import { help } from "./help/help";
import { logVersion } from "./commands/version";
import { hasArgs } from "./utils/args";
import { helpToken, token } from "./commands/token";
import { helpSite, site } from "./commands/site";

export const run = async () => {
  const [cmd, ...args] = process.argv.slice(2);

  if (isEmptyString(cmd)) {
    error("Missing command.");
    log(help);
    return;
  }

  if (["-h", "--help"].includes(cmd)) {
    log(help);
    return;
  }

  if (["-v", "--version"].includes(cmd)) {
    await logVersion();
    return;
  }

  if (hasArgs({ args, options: ["-h", "--help"] })) {
    switch (cmd) {
      case "site":
        helpSite();
        break;
      case "token":
        helpToken();
        break;
      default:
        error("Unknown command.");
        log(help);
    }
    return;
  }

  switch (cmd) {
    case "site":
      await site(args);
      break;
    case "token":
      await token(args);
      break;
    case "help":
      log(help);
      process.exit(0);
      break;
    default:
      error("Unknown command.");
      log(help);
      process.exit(-1);
  }
};

try {
  await run();
} catch (err: unknown) {
  error("An unexpected error happened 😫.\n");

  const prettifyError = (): string | undefined =>
    typeof err === "string" ? err : err instanceof Error ? err.message : undefined;

  const message = prettifyError();
  if (notEmptyString(message)) {
    console.log(message);
  }

  process.exit(1);
}
