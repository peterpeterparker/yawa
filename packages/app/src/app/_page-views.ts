import type { DefineHandler } from "../types/api";
import { AppSchema } from "yawa-schema/app";
import { DbPageViews } from "yawa-db";
import { isNullish, notEmptyString } from "yawa-common";
import { parseUserAgent } from "./helpers/user-agent";
import { parseCampaign } from "./helpers/campaign";
import type { AnalyticsSessionApiEnv } from "./types/api";

export const defineCreatePageView: DefineHandler<
  typeof AppSchema.Analytics.CreatePageViewRequestSchema,
  AnalyticsSessionApiEnv
> = async (context) => {
  const {
    req,
    var: {
      db: { connection },
      site: { id: site_id },
      sessionId: session_id,
    },
  } = context;

  const { visit_id, title, href: rawHref, time_zone, device } = req.valid("json");

  const url = URL.parse(rawHref);

  if (isNullish(url)) {
    return context.json({ error: "Invalid href" }, 400);
  }

  const readHeader = (header: string): string | null => {
    const value = req.header(header);
    return notEmptyString(value) ? value : null;
  };

  const referrer = readHeader("Referer");

  const user_agent = readHeader("User-Agent");
  const client = await parseUserAgent({ user_agent });

  const readLanguage = (): string | null => {
    const acceptLanguage = readHeader("Accept-Language")?.split(",")[0];
    return notEmptyString(acceptLanguage) ? acceptLanguage : null;
  };

  const language = readLanguage();

  const campaign = parseCampaign({ url });

  const cleanHref = (): string => {
    try {
      const url = new URL(rawHref);
      url.search = "";
      url.hash = "";
      return url.toString();
    } catch {
      // Unlikely to happen. URL was already parsed once.
      return rawHref;
    }
  };

  const href = cleanHref();

  const {
    inner_width: device_inner_width,
    inner_height: device_inner_height,
    screen_width: device_screen_width,
    screen_height: device_screen_height,
  } = device;

  const result = await DbPageViews.create({ connection }).insert({
    site_id,
    session_id,
    visit_id: visit_id ?? null,
    title,
    href,
    referrer,
    time_zone,
    user_agent,
    language,
    device_inner_width,
    device_inner_height,
    device_screen_width: device_screen_width ?? null,
    device_screen_height: device_screen_height ?? null,
    ...client,
    ...campaign,
  });

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to record page view" }, 500);
  }

  return context.newResponse(null, 204);
};
