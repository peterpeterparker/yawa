import { cyan, lime, magenta, yellow } from "../../utils/colors";
import { OPTION_HELP, TITLE_AND_VERSION, TOKEN_LIST_DESCRIPTION } from "../../_constants";
import { log } from "../../utils/log";

const usage = `Usage: ${lime("yawa")} ${cyan("token")} ${magenta("list")} ${yellow("[options]")}

Options:
  ${OPTION_HELP}
`;

const help = `${TITLE_AND_VERSION}

${TOKEN_LIST_DESCRIPTION}

${usage}
`;

export const logHelpTokenList = () => log(help);
