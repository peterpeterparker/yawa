import { cyan, lime, magenta, yellow } from "../../utils/colors";
import {
  OPTION_HELP,
  TITLE_AND_VERSION,
  TOKEN_CREATE_DESCRIPTION,
  TOKEN_DESCRIPTION,
  TOKEN_DISABLE_DESCRIPTION,
  TOKEN_LIST_DESCRIPTION,
} from "../../_constants";
import { log } from "../../utils/log";

const usage = `Usage: ${lime("yawa")} ${cyan("token")} ${magenta("<subcommand>")} ${yellow("[options]")}

Commands:
  ${cyan("create")}               ${TOKEN_CREATE_DESCRIPTION}
  ${cyan("disable")}              ${TOKEN_DISABLE_DESCRIPTION}
  ${cyan("list")}                 ${TOKEN_LIST_DESCRIPTION}
  
Options:
  ${OPTION_HELP}
`;

const help = `${TITLE_AND_VERSION}

${TOKEN_DESCRIPTION}

${usage}
`;

export const logHelpToken = () => log(help);
