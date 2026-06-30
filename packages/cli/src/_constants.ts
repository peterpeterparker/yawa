import { grey, yellow } from "./utils/colors";
import { version } from "../package.json";

export const TITLE_AND_VERSION = `Yawawa CLI ${grey(`v${version}`)}`;

export const OPTION_HELP = `${yellow("-h, --help")}            Output usage information`;

export const TOKEN_DESCRIPTION = "Administrate access token";
export const TOKEN_CREATE_DESCRIPTION = "Create a new access token";
export const TOKEN_LIST_DESCRIPTION = "List all access tokens";
export const TOKEN_DISABLE_DESCRIPTION = "Disable an access token";

export const SITE_DESCRIPTION = "Manage registered sites for analytics ingestion";
export const SITE_CREATE_DESCRIPTION = "Register a new site by hostname";
export const SITE_LINK_DESCRIPTION = "Link an additional hostname to an existing site";
export const SITE_LIST_DESCRIPTION = "List all registered sites";
export const SITE_UPDATE_DESCRIPTION = "Update the status of a site";
