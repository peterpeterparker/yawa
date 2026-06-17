import { describe, expect, test } from "bun:test";
import { parseCampaign } from "../../../src/app/helpers/campaign";

describe("parseCampaign", () => {
  const NULL_CAMPAIGN = {
    campaign_utm_source: null,
    campaign_utm_medium: null,
    campaign_utm_campaign: null,
    campaign_utm_term: null,
    campaign_utm_content: null,
  };

  test("returns all nulls when no utm params are present", () => {
    const url = new URL("https://example.com/");
    expect(parseCampaign({ url })).toEqual(NULL_CAMPAIGN);
  });

  test("parses all utm params when present", () => {
    const url = new URL(
      "https://example.com/?utm_source=twitter&utm_medium=social&utm_campaign=launch&utm_term=analytics&utm_content=banner",
    );

    expect(parseCampaign({ url })).toEqual({
      campaign_utm_source: "twitter",
      campaign_utm_medium: "social",
      campaign_utm_campaign: "launch",
      campaign_utm_term: "analytics",
      campaign_utm_content: "banner",
    });
  });

  test("parses partial utm params, leaving others null", () => {
    const url = new URL("https://example.com/?utm_source=newsletter");

    expect(parseCampaign({ url })).toEqual({
      campaign_utm_source: "newsletter",
      campaign_utm_medium: null,
      campaign_utm_campaign: null,
      campaign_utm_term: null,
      campaign_utm_content: null,
    });
  });

  test("ignores non-utm query params", () => {
    const url = new URL("https://example.com/?utm_source=twitter&ref=abc&page=2");

    expect(parseCampaign({ url })).toEqual({
      campaign_utm_source: "twitter",
      campaign_utm_medium: null,
      campaign_utm_campaign: null,
      campaign_utm_term: null,
      campaign_utm_content: null,
    });
  });
});
