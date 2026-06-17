import { cyan, lime } from "../utils/colors";
import { SITE_DESCRIPTION, TITLE_AND_VERSION, TOKEN_DESCRIPTION } from "../_constants";

export const help = `
${TITLE_AND_VERSION}


Usage: ${lime("yawa")} ${cyan("<command>")}

Commands:
  ${cyan("site")}                ${SITE_DESCRIPTION}
  ${cyan("token")}               ${TOKEN_DESCRIPTION}
  ${cyan("help")}                Display help information
`;
