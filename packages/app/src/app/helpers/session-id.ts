import type { Ip } from "../types/ip";
import { hash } from "../../utils/hash";
import type { Analytics } from "yawa-schema/db";
import { isEmptyString, type Result } from "yawa-common";
import { envSessionSecret } from "../../env.ts";

export class HashSessionIdMissingSecretError extends Error {}

export const hashSessionId = ({
  ip,
  user_agent,
  site_id,
}: {
  ip: Ip;
  user_agent: string;
  site_id: Analytics["Site"]["id"];
}): Result<{ sessionId: string }> => {
  const startOfDay = (date: Date): Date => {
    const d = new Date(date);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  };

  const sessionSecret = envSessionSecret();

  if (isEmptyString(sessionSecret)) {
    return { status: "error", err: new HashSessionIdMissingSecretError() };
  }

  const { hash: salt } = hash({ input: startOfDay(new Date()).toISOString() });
  const { hash: sessionHash } = hash({
    input: `${site_id}|${ip}|${user_agent}|${salt}|${sessionSecret}`,
  });
  const sessionId = Bun.randomUUIDv5(sessionHash, "dns");

  return { status: "success", result: { sessionId } };
};
