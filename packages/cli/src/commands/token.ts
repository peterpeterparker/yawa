import { error } from "../utils/log";
import { logHelpToken } from "../help/_token/help.ts";
import { logHelpTokenCreate } from "../help/_token/create.help.ts";
import { tokenCreate } from "./_token/create.ts";

export const token = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case "create":
      await tokenCreate(args);
      break;

    default:
      error("Unknown subcommand.");
      logHelpToken();
  }
};

export const helpToken = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case "create":
      logHelpTokenCreate();
      break;
    default:
      logHelpToken();
  }
};
