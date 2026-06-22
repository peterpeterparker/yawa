import { error } from "../utils/log";
import { logHelpSite } from "../help/_site/help.ts";
import { logHelpSiteCreate } from "../help/_site/create.help.ts";
import { siteCreate } from "./_site/create.ts";

export const site = async (args?: string[]) => {
  const [subCommand] = args ?? [];

  switch (subCommand) {
    case "create":
      await siteCreate(args);
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
    default:
      logHelpSite();
  }
};
