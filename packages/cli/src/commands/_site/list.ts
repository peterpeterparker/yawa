import { InternalSchema } from "yawa-schema/app";
import { ENV } from "../../env";
import { exitWithResponse } from "../../utils/exit";

export const sitesList = async () => {
  const response = await fetch(`${ENV.APP.INTERNAL_URL}/sites`, {
    method: "GET",
  });

  if (!response.ok) {
    await exitWithResponse({
      response,
      msg: "Failed to list sites",
    });
  }

  const { sites } = InternalSchema.Site.ListSitesResponseSchema.parse(await response.json());

  const table = sites.reduce(
    (acc, { id, ...rest }) => ({
      ...acc,
      [id]: rest,
    }),
    {},
  );

  console.table(table);
};
