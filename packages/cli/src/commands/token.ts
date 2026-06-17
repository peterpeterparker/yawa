import { error } from "../utils/log";
import { logHelpToken } from "../help/token.help";
import { logHelpTokenCreate } from "../help/token.create.help";
import { tokenCreate } from "./_token.create";

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
