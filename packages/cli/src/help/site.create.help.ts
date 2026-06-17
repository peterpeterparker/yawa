import { cyan, lime, magenta, yellow } from "../utils/colors";
import { OPTION_HELP, TITLE_AND_VERSION, SITE_CREATE_DESCRIPTION } from "../_constants";
import { log } from "../utils/log";

const usage = `Usage: ${lime("yawa")} ${cyan("site")} ${magenta("create")} ${yellow("[options]")}

Options:
  ${yellow("--hostname")}             Hostname to register (required, e.g. "example.com")
  ${OPTION_HELP}
`;

const help = `${TITLE_AND_VERSION}

${SITE_CREATE_DESCRIPTION}

${usage}
`;

export const logHelpSiteCreate = () => log(help);
