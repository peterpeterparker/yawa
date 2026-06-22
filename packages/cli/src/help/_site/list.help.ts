import { cyan, lime, magenta, yellow } from "../../utils/colors";
import { OPTION_HELP, TITLE_AND_VERSION, SITE_LIST_DESCRIPTION } from "../../_constants";
import { log } from "../../utils/log";

const usage = `Usage: ${lime("yawa")} ${cyan("site")} ${magenta("list")} ${yellow("[options]")}

Options:
  ${OPTION_HELP}
`;

const help = `${TITLE_AND_VERSION}

${SITE_LIST_DESCRIPTION}

${usage}
`;

export const logHelpSiteList = () => log(help);
