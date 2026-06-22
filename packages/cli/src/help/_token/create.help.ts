import { cyan, lime, magenta, yellow } from "../../utils/colors.ts";
import { OPTION_HELP, TITLE_AND_VERSION, TOKEN_CREATE_DESCRIPTION } from "../../_constants.ts";
import { log } from "../../utils/log.ts";

const usage = `Usage: ${lime("yawa")} ${cyan("token")} ${magenta("create")} ${yellow("[options]")}

Options:
  ${yellow("--name")}                Name to identify the token (required)
  ${yellow("--expires")}             Optional expiry date in ISO format (e.g. "2027-01-01")
  ${OPTION_HELP}
`;

const help = `${TITLE_AND_VERSION}

${TOKEN_CREATE_DESCRIPTION}

${usage}
`;

export const logHelpTokenCreate = () => log(help);
