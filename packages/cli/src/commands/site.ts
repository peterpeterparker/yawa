import { error } from "../utils/log";
import { logHelpSite } from "../help/_site/help";
import { logHelpSiteCreate } from "../help/_site/create.help";
import { siteCreate } from "./_site/create";
import { sitesList } from "./_site/list";
import { logHelpSiteList } from "../help/_site/list.help";
import { siteUpdate } from "./_site/update";
import { logHelpSiteUpdate } from "../help/_site/update.help";

export const site = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case "create":
      await siteCreate(args);
      break;

    case "list":
      await sitesList();
      break;

    case "update":
      await siteUpdate(args);
      break;

    default:
      error("Unknown subcommand.");
      logHelpSite();
  }
};

export const helpSite = (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case "create":
      logHelpSiteCreate();
      break;

    case "list":
      logHelpSiteList();
      break;

    case "update":
      logHelpSiteUpdate();
      break;

    default:
      logHelpSite();
  }
};
