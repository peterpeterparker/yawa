import { describe, expect, test } from "bun:test";
import { parseUserAgent } from "../../../src/app/helpers/user-agent";

describe("parseUserAgent", () => {
  const NULL_CLIENT = {
    client_browser: null,
    client_operating_system: null,
    client_device: null,
  };

  test("returns parsed browser and os for a desktop user agent", async () => {
    const ua =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

    const result = await parseUserAgent({ user_agent: ua });

    expect(result.client_browser).toBe("Chrome");
    expect(result.client_operating_system).toBe("Mac OS");
    expect(result.client_device).toBeNull();
  });

  test("returns device type for a mobile user agent", async () => {
    const ua =
      "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36";

    const result = await parseUserAgent({ user_agent: ua });

    expect(result.client_browser).toBe("Chrome");
    expect(result.client_operating_system).toBe("Android");
    expect(result.client_device).toBe("mobile");
  });

  test("returns all nulls for an unrecognized user agent string", async () => {
    const result = await parseUserAgent({ user_agent: "unknown-agent-string" });
    expect(result).toEqual(NULL_CLIENT);
  });

  test("returns all nulls when user_agent is null", async () => {
    const result = await parseUserAgent({ user_agent: null });
    expect(result).toEqual(NULL_CLIENT);
  });
});
