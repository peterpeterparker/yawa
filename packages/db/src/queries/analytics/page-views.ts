import type { DbConnection } from "../../db/connection";
import type { Result } from "yawa-common";
import * as z from "zod";
import type { QueryAnalyticsParams, QueryAnalyticsParamsWithLimit } from "./types";

const StatsSchema = z.strictObject({
  pageviews: z.coerce.number(),
  visitors: z.coerce.number(),
  visits: z.coerce.number(),
  bounces: z.coerce.number(),
});

export const OptionStatsSchema = StatsSchema.optional();

const ExpandedSchema = z.strictObject({
  name: z.string(),
  pageviews: z.coerce.number(),
  visitors: z.coerce.number(),
  visits: z.coerce.number(),
  bounces: z.coerce.number(),
  totaltime: z.coerce.number(),
});

export const ListExpandedSchema = z.array(ExpandedSchema);

const MetricSchema = z.strictObject({
  name: z.string(),
  visitors: z.coerce.number(),
});

export const ListMetricSchema = z.array(MetricSchema);

const SeriesSchema = z.strictObject({
  date: z.string(),
  pageviews: z.coerce.number(),
  visitors: z.coerce.number(),
});

export const ListSeriesSchema = z.array(SeriesSchema);

const HourSchema = z.strictObject({
  hour: z.coerce.number(),
  pageviews: z.coerce.number(),
  visitors: z.coerce.number(),
});

export const ListHourSchema = z.array(HourSchema);

const PageSchema = z.strictObject({
  href: z.string(),
  visitors: z.coerce.number(),
  pageviews: z.coerce.number(),
});

export const ListPageSchema = z.array(PageSchema);

const TitleSchema = z.strictObject({
  name: z.string(),
  visitors: z.coerce.number(),
  pageviews: z.coerce.number(),
});

export const ListTitleSchema = z.array(TitleSchema);

/**
 * Inactivity gap after which a new visit starts for the same session.
 */
const VISIT_TIMEOUT = "INTERVAL 30 MINUTE";

/**
 * CTE exposing the page views of a site within a date range, each tagged with a `visit_key`.
 *
 * Visits are derived server-side from the daily `session_id` hash: a new visit starts on the
 * first pageview of a session or after more than 30 minutes of inactivity. The `visit_id` sent
 * by the tracker is ignored because it is regenerated on every full page load.
 *
 * Because `session_id` rotates daily, visits also end at midnight.
 */
const VISITS_CTE = `WITH flagged_page_views AS (
    SELECT *,
           CASE
             WHEN created_at - LAG(created_at) OVER (PARTITION BY session_id ORDER BY created_at) <= ${VISIT_TIMEOUT}
             THEN 0 ELSE 1
           END AS new_visit
    FROM yawa_analytics.page_views
    WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
  ),
  visit_page_views AS (
    SELECT *,
           session_id::VARCHAR || ':' || CAST(SUM(new_visit) OVER (
             PARTITION BY session_id ORDER BY created_at ROWS UNBOUNDED PRECEDING
           ) AS VARCHAR) AS visit_key
    FROM flagged_page_views
  )`;

/**
 * Operating system names, as reported by ua-parser-js, that never count as desktop
 * when the device type is missing (null).
 */
const MOBILE_OPERATING_SYSTEMS = [
  "Android",
  "iOS",
  "HarmonyOS",
  "OpenHarmony",
  "KaiOS",
  "watchOS",
  "Windows Phone",
  "Windows Phone OS",
  "Windows Mobile",
  "BlackBerry",
  "Tizen",
  "Sailfish",
  "Ubuntu Touch",
  "Firefox OS",
]
  .map((os) => `'${os.toLowerCase()}'`)
  .join(", ");

export class DbPageViewsAnalytics {
  #connection: DbConnection;

  private constructor({ connection }: { connection: DbConnection }) {
    this.#connection = connection;
  }

  static create({ connection }: { connection: DbConnection }): DbPageViewsAnalytics {
    return new this({ connection });
  }

  /**
   * Core summary metrics for a date range.
   * Returns total pageviews, unique visitors (by session), visits (session activity
   * split by 30 minutes of inactivity), and bounce count (visits with only one pageview).
   */
  async getStats({
    site_id,
    from,
    to,
  }: QueryAnalyticsParams): Promise<Result<z.infer<typeof OptionStatsSchema>>> {
    return this.#connection.queryOne({
      sql: `${VISITS_CTE}
            SELECT
              COUNT(*) AS pageviews,
              COUNT(DISTINCT session_id) AS visitors,
              COUNT(DISTINCT visit_key) AS visits,
              SUM(CASE WHEN visit_pageviews = 1 THEN 1 ELSE 0 END) AS bounces
            FROM (
              SELECT session_id, visit_key,
                     COUNT(*) OVER (PARTITION BY visit_key) AS visit_pageviews
              FROM visit_page_views
            ) t`,
      schema: StatsSchema,
      values: { site_id, from, to },
    });
  }

  /**
   * Pageviews and unique visitors per day for a date range.
   * Useful for trend charts and identifying traffic spikes or drops.
   */
  async getPageviewsSeries({
    site_id,
    from,
    to,
  }: QueryAnalyticsParams): Promise<Result<z.infer<typeof ListSeriesSchema>>> {
    return this.#connection.query({
      sql: `SELECT
              DATE_TRUNC('day', created_at)::VARCHAR AS date,
              COUNT(*) AS pageviews,
              COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
            GROUP BY 1 ORDER BY 1`,
      schema: SeriesSchema,
      values: { site_id, from, to },
    });
  }

  /**
   * Pageviews and unique visitors bucketed by hour of day (0–23).
   * Useful for identifying peak traffic hours across a date range.
   */
  async getPageviewsByHour({
    site_id,
    from,
    to,
  }: QueryAnalyticsParams): Promise<Result<z.infer<typeof ListHourSchema>>> {
    return this.#connection.query({
      sql: `SELECT
              HOUR(created_at) AS hour,
              COUNT(*) AS pageviews,
              COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
            GROUP BY 1 ORDER BY 1`,
      schema: HourSchema,
      values: { site_id, from, to },
    });
  }

  /**
   * Top pages by unique visitors, with total pageview count.
   * Identifies the most visited URLs on the site.
   */
  async getTopPages({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListPageSchema>>> {
    return this.#connection.query({
      sql: `SELECT href, COUNT(DISTINCT session_id) AS visitors, COUNT(*) AS pageviews
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
            GROUP BY href ORDER BY visitors DESC LIMIT $limit`,
      schema: PageSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Top pages with expanded engagement metrics: pageviews, visitors, visits,
   * bounces, and total time spent (in ms). Useful for identifying high-traffic
   * but low-engagement pages.
   */
  async getTopPagesExpanded({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListExpandedSchema>>> {
    return this.#connection.query({
      sql: `${VISITS_CTE}
            SELECT
              href AS name,
              SUM(t.c) AS pageviews,
              COUNT(DISTINCT t.session_id) AS visitors,
              COUNT(DISTINCT t.visit_key) AS visits,
              SUM(CASE WHEN t.c = 1 THEN 1 ELSE 0 END) AS bounces,
              SUM(epoch_ms(t.max_time) - epoch_ms(t.min_time)) AS totaltime
            FROM (
              SELECT href, session_id, visit_key,
                     COUNT(*) AS c,
                     MIN(created_at) AS min_time,
                     MAX(created_at) AS max_time
              FROM visit_page_views
              GROUP BY href, session_id, visit_key
            ) t
            WHERE name != ''
            GROUP BY name
            ORDER BY visitors DESC, visits DESC
            LIMIT $limit`,
      schema: ExpandedSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Top page titles by unique visitors.
   * Useful when URLs are dynamic but titles are descriptive.
   */
  async getTopTitles({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListTitleSchema>>> {
    return this.#connection.query({
      sql: `SELECT title AS name, COUNT(DISTINCT session_id) AS visitors, COUNT(*) AS pageviews
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND title IS NOT NULL AND title != ''
            GROUP BY title ORDER BY visitors DESC LIMIT $limit`,
      schema: TitleSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Most common first pages of visits (landing pages).
   * Identifies where visitors enter the site.
   */
  async getEntryPages({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `${VISITS_CTE}
            SELECT name, COUNT(DISTINCT session_id) AS visitors
            FROM (
              SELECT ARGMIN(href, created_at) AS name, ANY_VALUE(session_id) AS session_id
              FROM visit_page_views
              GROUP BY visit_key
            ) t
            GROUP BY name
            ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Most common last pages of visits (exit pages).
   * Identifies where visitors leave the site.
   */
  async getExitPages({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `${VISITS_CTE}
            SELECT name, COUNT(DISTINCT session_id) AS visitors
            FROM (
              SELECT ARGMAX(href, created_at) AS name, ANY_VALUE(session_id) AS session_id
              FROM visit_page_views
              GROUP BY visit_key
            ) t
            GROUP BY name
            ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Top referrers by unique visitors, excluding internal/empty referrers.
   * Identifies where traffic is coming from.
   */
  async getTopReferrers({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT referrer AS name, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND referrer IS NOT NULL AND referrer != ''
            GROUP BY referrer ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Top referrers with expanded engagement metrics: pageviews, visitors, visits,
   * bounces, and total time spent. Useful for comparing referral quality.
   */
  async getTopReferrersExpanded({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListExpandedSchema>>> {
    return this.#connection.query({
      sql: `${VISITS_CTE}
            SELECT
              referrer AS name,
              SUM(t.c) AS pageviews,
              COUNT(DISTINCT t.session_id) AS visitors,
              COUNT(DISTINCT t.visit_key) AS visits,
              SUM(CASE WHEN t.c = 1 THEN 1 ELSE 0 END) AS bounces,
              SUM(epoch_ms(t.max_time) - epoch_ms(t.min_time)) AS totaltime
            FROM (
              SELECT referrer, session_id, visit_key,
                     COUNT(*) AS c,
                     MIN(created_at) AS min_time,
                     MAX(created_at) AS max_time
              FROM visit_page_views
              WHERE referrer IS NOT NULL AND referrer != ''
              GROUP BY referrer, session_id, visit_key
            ) t
            WHERE name != ''
            GROUP BY name
            ORDER BY visitors DESC
            LIMIT $limit`,
      schema: ExpandedSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Browser breakdown by unique visitors.
   * Identifies which browsers visitors use (Chrome, Safari, Firefox, etc.).
   */
  async getBrowsers({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT client_browser AS name, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND client_browser IS NOT NULL
            GROUP BY client_browser ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Operating system breakdown by unique visitors.
   * Identifies which OS visitors use (macOS, Windows, iOS, Android, etc.).
   */
  async getOperatingSystems({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT client_operating_system AS name, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND client_operating_system IS NOT NULL
            GROUP BY client_operating_system ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Device type breakdown by unique visitors.
   * Identifies whether visitors use mobile, tablet, or desktop.
   *
   * ua-parser-js leaves the device type undefined for desktop browsers. A missing device type
   * is therefore reported as "desktop" when a non-mobile operating system was detected.
   * Page views with neither (typically crawlers) are excluded.
   */
  async getDevices({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT name, COUNT(DISTINCT session_id) AS visitors
            FROM (
              SELECT session_id,
                     COALESCE(
                       client_device,
                       CASE
                         WHEN client_operating_system IS NOT NULL
                          AND LOWER(client_operating_system) NOT IN (${MOBILE_OPERATING_SYSTEMS})
                         THEN 'desktop'
                       END
                     ) AS name
              FROM yawa_analytics.page_views
              WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
            ) t
            WHERE name IS NOT NULL
            GROUP BY name ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Language breakdown by unique visitors (normalized to 2-letter code, e.g. "en", "fr").
   * Identifies the primary languages of visitors.
   */
  async getLanguages({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT LEFT(language, 2) AS name, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND language IS NOT NULL
            GROUP BY name ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Time zone breakdown by unique visitors.
   * Identifies where visitors are located based on their configured time zone.
   */
  async getTimeZones({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT time_zone AS name, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND time_zone IS NOT NULL
            GROUP BY time_zone ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * UTM source breakdown by unique visitors.
   * Identifies which traffic sources (e.g. "twitter", "newsletter") are driving visits.
   */
  async getUtmSources({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT campaign_utm_source AS name, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND campaign_utm_source IS NOT NULL
            GROUP BY campaign_utm_source ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * UTM medium breakdown by unique visitors.
   * Identifies which marketing channels (e.g. "email", "social", "cpc") are driving visits.
   */
  async getUtmMediums({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT campaign_utm_medium AS name, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND campaign_utm_medium IS NOT NULL
            GROUP BY campaign_utm_medium ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * UTM campaign breakdown by unique visitors.
   * Identifies which specific campaigns (e.g. "black-friday", "product-launch") are driving visits.
   */
  async getUtmCampaigns({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT campaign_utm_campaign AS name, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND campaign_utm_campaign IS NOT NULL
            GROUP BY campaign_utm_campaign ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * UTM content breakdown by unique visitors.
   * Identifies which specific links or ad variants within a campaign are driving visits.
   */
  async getUtmContents({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT campaign_utm_content AS name, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND campaign_utm_content IS NOT NULL
            GROUP BY campaign_utm_content ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * UTM term breakdown by unique visitors.
   * Identifies which paid search keywords are driving visits.
   */
  async getUtmTerms({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListMetricSchema>>> {
    return this.#connection.query({
      sql: `SELECT campaign_utm_term AS name, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.page_views
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
              AND campaign_utm_term IS NOT NULL
            GROUP BY campaign_utm_term ORDER BY visitors DESC LIMIT $limit`,
      schema: MetricSchema,
      values: { site_id, from, to, limit },
    });
  }
}
