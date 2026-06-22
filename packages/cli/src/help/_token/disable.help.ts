import { cyan, lime, magenta, yellow } from "../../utils/colors";
import { OPTION_HELP, TITLE_AND_VERSION, TOKEN_DISABLE_DESCRIPTION } from "../../_constants";
import { log } from "../../utils/log";

const usage = `Usage: ${lime("yawa")} ${cyan("token")} ${magenta("disable")} ${yellow("[options]")}

Options:
  ${yellow("--id")}                  Token ID to disable
  ${OPTION_HELP}
`;

const help = `${TITLE_AND_VERSION}

${TOKEN_DISABLE_DESCRIPTION}

${usage}
`;

export const logHelpTokenDisable = () => log(help);
