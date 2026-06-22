import { InternalSchema } from "yawa-schema/app";
import { ENV } from "../../env";
import { exitWithResponse } from "../../utils/exit";

export const tokensList = async () => {
  const response = await fetch(`${ENV.APP.INTERNAL_URL}/tokens`, {
    method: "GET",
  });

  if (!response.ok) {
    await exitWithResponse({
      response,
      msg: "Failed to list tokens",
    });
  }

  const { tokens } = InternalSchema.Token.ListTokensResponseSchema.parse(await response.json());

  const table = tokens.reduce(
    (acc, { id, name, expires_at }) => ({
      ...acc,
      [id]: {
        name,
        expires_at: expires_at ?? "never",
      },
    }),
    {},
  );

  console.table(table);
};
