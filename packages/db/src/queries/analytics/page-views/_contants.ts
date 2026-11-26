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
export const VISITS_CTE = `WITH flagged_page_views AS (
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
export const MOBILE_OPERATING_SYSTEMS = [
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
