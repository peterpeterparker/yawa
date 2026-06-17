import * as TokenSchema from "./internal/token";
import * as AnalyticsSchema from "./app/analytics";
import * as SiteSchema from "./internal/site";
import * as ErrorSchema from "./common/error";

const InternalSchema = {
  Token: TokenSchema,
  Site: SiteSchema,
};

const CommonSchema = {
  Error: ErrorSchema,
};

const AppSchema = {
  Analytics: AnalyticsSchema,
};

export { InternalSchema, CommonSchema, AppSchema };
