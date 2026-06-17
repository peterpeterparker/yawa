import { isEmptyString, notEmptyString, type Option } from "yawa-common";

export const envSessionSecret = (): Option<string> =>
  notEmptyString(process.env.YAWA_SESSION_SECRET) ? process.env.YAWA_SESSION_SECRET : undefined;

if (isEmptyString(envSessionSecret())) {
  console.log(
    "No YAWA_SESSION_SECRET set to hash the session ID. Random UUID v7 will be used instead.",
  );
}
