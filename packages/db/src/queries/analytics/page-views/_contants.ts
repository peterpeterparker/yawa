/**
 * Inactivity gap after which a new visit starts for the same session.
 */
const VISIT_TIMEOUT = "INTERVAL 30 MINUTE";

/**
 * Page views tagged with a `visit_key`: a new visit starts per `session_id` after 30 minutes
 * of inactivity. The tracker's `visit_id` is ignored, as it changes on every page load.
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
 * {@link VISITS_CTE} plus, per page view, the visit's pageview count and the time until
 * the next pageview (NULL for the last one).
 */
export const VISIT_METRICS_CTE = `${VISITS_CTE},
  visit_page_view_metrics AS (
    SELECT *,
           COUNT(*) OVER (PARTITION BY visit_key) AS visit_pageviews,
           epoch_ms(LEAD(created_at) OVER (PARTITION BY visit_key ORDER BY created_at))
             - epoch_ms(created_at) AS duration_ms
    FROM visit_page_views
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
