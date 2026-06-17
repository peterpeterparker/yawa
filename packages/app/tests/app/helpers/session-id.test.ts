import { describe, expect, test } from "bun:test";
import { hashSessionId } from "../../../src/app/helpers/session-id";

describe("hashSessionId", () => {
  const site_id = "01912d4e-1234-7000-8000-000000000000";
  const ip = "192.0.2.1";
  const user_agent = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36";

  const hash = (args: Parameters<typeof hashSessionId>[0]) => {
    const result = hashSessionId(args);
    if (result.status === "error") throw result.err;
    return result.result.sessionId;
  };

  test("returns a valid UUID", () => {
    expect(hash({ ip, user_agent, site_id })).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  test("is deterministic — same inputs produce same session_id", () => {
    expect(hash({ ip, user_agent, site_id })).toBe(hash({ ip, user_agent, site_id }));
  });

  test("differs for different IPs", () => {
    expect(hash({ ip: "192.0.2.1", user_agent, site_id })).not.toBe(
      hash({ ip: "192.0.2.2", user_agent, site_id }),
    );
  });

  test("differs for different user agents", () => {
    expect(hash({ ip, user_agent: "Mozilla/5.0 Chrome", site_id })).not.toBe(
      hash({ ip, user_agent: "Mozilla/5.0 Firefox", site_id }),
    );
  });

  test("differs for different site IDs", () => {
    expect(hash({ ip, user_agent, site_id: "01912d4e-1234-7000-8000-000000000000" })).not.toBe(
      hash({ ip, user_agent, site_id: "01912d4e-1234-7000-8000-000000000001" }),
    );
  });

  test("returns error when secret is not set", () => {
    delete process.env.YAWA_SESSION_SECRET;
    const result = hashSessionId({ ip, user_agent, site_id });
    expect(result.status).toBe("error");
  });
});
