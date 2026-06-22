import { error } from "../utils/log";
import { logHelpToken } from "../help/_token/help";
import { logHelpTokenCreate } from "../help/_token/create.help";
import { tokenCreate } from "./_token/create";
import { tokensList } from "./_token/list";
import { logHelpTokenList } from "../help/_token/list.help";
import { tokenDisable } from "./_token/disable";
import { logHelpTokenDisable } from "../help/_token/disable.help";

export const token = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case "create":
      await tokenCreate(args);
      break;

    case "disable":
      await tokenDisable(args);
      break;

    case "list":
      await tokensList();
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

    case "disable":
      logHelpTokenDisable();
      break;

    case "list":
      logHelpTokenList();
      break;

    default:
      logHelpToken();
  }
};
