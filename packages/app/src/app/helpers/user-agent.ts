import { isNullish } from "yawa-common";
import type { Analytics } from "yawa-schema/db";

type PageViewClient = Pick<
  Analytics["PageView"],
  "client_browser" | "client_operating_system" | "client_device"
>;

export const parseUserAgent = async ({
  user_agent,
}: Pick<Analytics["PageView"], "user_agent">): Promise<PageViewClient> => {
  // In CI test, parsing undefined agent returns WebKit on linux
  if (isNullish(user_agent)) {
    return {
      client_device: null,
      client_browser: null,
      client_operating_system: null,
    };
  }

  const UAParser = await import("ua-parser-js");

  const parser = new UAParser.default(user_agent);
  const { browser, os, device } = parser.getResult();

  return {
    client_browser: browser.name ?? null,
    client_operating_system: os.name ?? null,
    client_device: device?.type ?? null,
  };
};
