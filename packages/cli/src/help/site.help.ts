import { cyan, lime, magenta, yellow } from "../utils/colors";
import {
  OPTION_HELP,
  TITLE_AND_VERSION,
  SITE_CREATE_DESCRIPTION,
  SITE_DESCRIPTION,
} from "../_constants";
import { log } from "../utils/log";

const usage = `Usage: ${lime("yawa")} ${cyan("site")} ${magenta("<subcommand>")} ${yellow("[options]")}

Commands:
  ${cyan("create")}               ${SITE_CREATE_DESCRIPTION}
  
Options:
  ${OPTION_HELP}
`;

const help = `${TITLE_AND_VERSION}

${SITE_DESCRIPTION}

${usage}
`;

export const logHelpSite = () => log(help);
