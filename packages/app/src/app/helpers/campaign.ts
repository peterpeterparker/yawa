import type { Analytics } from "yawa-schema/db";

type PageViewCampaign = Pick<
  Analytics["PageView"],
  | "campaign_utm_source"
  | "campaign_utm_medium"
  | "campaign_utm_campaign"
  | "campaign_utm_term"
  | "campaign_utm_content"
>;

export const parseCampaign = ({ url: { search } }: { url: URL }): PageViewCampaign => {
  const searchParams = new URLSearchParams(search);

  const utm_source = searchParams.get("utm_source");
  const utm_medium = searchParams.get("utm_medium");
  const utm_campaign = searchParams.get("utm_campaign");
  const utm_term = searchParams.get("utm_term");
  const utm_content = searchParams.get("utm_content");

  return {
    campaign_utm_source: utm_source ?? null,
    campaign_utm_medium: utm_medium ?? null,
    campaign_utm_campaign: utm_campaign ?? null,
    campaign_utm_term: utm_term ?? null,
    campaign_utm_content: utm_content ?? null,
  };
};
