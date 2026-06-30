import { cyan, lime, magenta, yellow } from "../../utils/colors";
import { OPTION_HELP, TITLE_AND_VERSION, SITE_LINK_DESCRIPTION } from "../../_constants";
import { log } from "../../utils/log";

const usage = `Usage: ${lime("yawa")} ${cyan("site")} ${magenta("link")} ${yellow("[options]")}

Options:
  ${yellow("--id")}                  Site ID to link the hostname to
  ${yellow("--hostname")}            Additional hostname to link (e.g. "www.example.com")
  ${OPTION_HELP}
`;

const help = `${TITLE_AND_VERSION}

${SITE_LINK_DESCRIPTION}

${usage}
`;

export const logHelpSiteLink = () => log(help);
