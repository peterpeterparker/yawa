import { CommonSchema } from "yawa-schema/app";
import { error } from "./log";

export const exitWithResponse = async ({
  response,
  msg,
}: {
  response: Response;
  msg: string;
}): Promise<never> => {
  const text = await response.text();

  try {
    const { error: err } = CommonSchema.Error.ErrorSchema.parse(JSON.parse(text));
    error(`${msg}:`, err);
  } catch {
    error(`${msg}:`, text);
  }

  process.exit(1);
};
