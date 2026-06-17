import type { DbConnection } from "../../db/connection";
import type { Result } from "yawa-common";
import { type Analytics, AnalyticsSchema } from "yawa-schema/db";

export class DbPageViews {
  #connection: DbConnection;

  private constructor({ connection }: { connection: DbConnection }) {
    this.#connection = connection;
  }

  static create({ connection }: { connection: DbConnection }): DbPageViews {
    return new this({ connection });
  }

  async insert(
    pageView: Omit<Analytics["PageView"], "id" | "created_at">,
  ): Promise<Result<Pick<Analytics["PageView"], "id">>> {
    return this.#connection.runAndReturnOne({
      sql: `INSERT INTO yawa_analytics.page_views (
        site_id, session_id, visit_id, title, href, referrer, time_zone, user_agent, language,
        device_inner_width, device_inner_height, device_screen_width, device_screen_height,
        client_browser, client_operating_system, client_device,
        campaign_utm_source, campaign_utm_medium, campaign_utm_campaign, campaign_utm_term, campaign_utm_content
      ) VALUES (
        $site_id, $session_id, $visit_id, $title, $href, $referrer, $time_zone, $user_agent, $language,
        $device_inner_width, $device_inner_height, $device_screen_width, $device_screen_height,
        $client_browser, $client_operating_system, $client_device,
        $campaign_utm_source, $campaign_utm_medium, $campaign_utm_campaign, $campaign_utm_term, $campaign_utm_content
      ) RETURNING id`,
      schema: AnalyticsSchema.PageViewSchema.pick({ id: true }),
      values: pageView,
    });
  }
}
