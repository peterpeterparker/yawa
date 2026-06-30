import { type Internal, InternalSchema } from "yawa-schema/app";
import { ENV } from "../../env";
import { exitWithResponse } from "../../utils/exit";

type ResponseResult<T> = { status: "success"; result: T } | { status: "error"; response: Response };

export const sitesList = async () => {
  const sitesResult = await listSites();

  if (sitesResult.status === "error") {
    await exitWithResponse({
      response: sitesResult.response,
      msg: "Failed to list sites",
    });
    return;
  }

  const { result: sites } = sitesResult;

  const linkedSitesResult = await listLinkedSites();

  if (linkedSitesResult.status === "error") {
    await exitWithResponse({
      response: linkedSitesResult.response,
      msg: "Failed to list linked sites",
    });
    return;
  }

  const { result: linkedSites } = linkedSitesResult;

  const table = sites.reduce(
    (acc, { id, ...rest }) => ({
      ...acc,
      [id]: {
        ...rest,
        linked_hostnames: linkedSites
          .filter((linked) => linked.site_id === id)
          .map((linked) => linked.hostname)
          .join(", "),
      },
    }),
    {},
  );

  console.table(table);
};

const listSites = async (): Promise<
  ResponseResult<Internal["Site"]["ListSitesResponse"]["sites"]>
> => {
  const response = await fetch(`${ENV.APP.INTERNAL_URL}/sites`, {
    method: "GET",
  });

  if (!response.ok) {
    return { status: "error", response };
  }

  const { sites } = InternalSchema.Site.ListSitesResponseSchema.parse(await response.json());
  return { status: "success", result: sites };
};

const listLinkedSites = async (): Promise<
  ResponseResult<Internal["Site"]["ListLinkedSitesResponse"]["linkedSites"]>
> => {
  const response = await fetch(`${ENV.APP.INTERNAL_URL}/sites/linked`, {
    method: "GET",
  });

  if (!response.ok) {
    return { status: "error", response };
  }

  const { linkedSites } = InternalSchema.Site.ListLinkedSitesResponseSchema.parse(
    await response.json(),
  );
  return { status: "success", result: linkedSites };
};
