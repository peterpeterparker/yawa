import { cyan, lime, magenta, yellow } from "../../utils/colors";
import { OPTION_HELP, TITLE_AND_VERSION, SITE_UPDATE_DESCRIPTION } from "../../_constants";
import { log } from "../../utils/log";

const usage = `Usage: ${lime("yawa")} ${cyan("site")} ${magenta("update")} ${yellow("[options]")}

Options:
  ${yellow("--id")}                  Site ID to update
  ${yellow("--status")}              New status ("active", "disabled" or "archived")
  ${OPTION_HELP}
`;

const help = `${TITLE_AND_VERSION}

${SITE_UPDATE_DESCRIPTION}

${usage}
`;

export const logHelpSiteUpdate = () => log(help);
