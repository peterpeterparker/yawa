---
title: MCP tools
description: Reference of all MCP tools exposed by yawa.
---

Once connected, your MCP client has access to the following tools.

## Sites

| Tool         | Description                              |
| ------------ | ---------------------------------------- |
| `list_sites` | List all registered sites with their IDs |

## Page views

| Tool                         | Description                                    |
| ---------------------------- | ---------------------------------------------- |
| `get_stats`                  | Total pageviews, visitors, visits and bounces  |
| `get_pageviews_series`       | Daily pageviews and visitors over a date range |
| `get_pageviews_by_hour`      | Pageviews by hour of day (0-23)                |
| `get_top_pages`              | Most visited URLs                              |
| `get_top_pages_expanded`     | Top pages with engagement metrics              |
| `get_top_titles`             | Top page titles                                |
| `get_entry_pages`            | Most common landing pages                      |
| `get_exit_pages`             | Most common exit pages                         |
| `get_top_referrers`          | Top referrers                                  |
| `get_top_referrers_expanded` | Top referrers with engagement metrics          |
| `get_browsers`               | Browser breakdown                              |
| `get_operating_systems`      | OS breakdown                                   |
| `get_devices`                | Device type breakdown                          |
| `get_languages`              | Language breakdown                             |
| `get_time_zones`             | Time zone breakdown                            |
| `get_utm_sources`            | UTM source breakdown                           |
| `get_utm_mediums`            | UTM medium breakdown                           |
| `get_utm_campaigns`          | UTM campaign breakdown                         |
| `get_utm_contents`           | UTM content breakdown                          |
| `get_utm_terms`              | UTM term breakdown                             |

## Custom events

| Tool               | Description                          |
| ------------------ | ------------------------------------ |
| `get_top_events`   | Custom event names ranked by count   |
| `get_event_series` | Daily event counts over a date range |

## Web Vitals

| Tool                          | Description                                                |
| ----------------------------- | ---------------------------------------------------------- |
| `get_web_vitals_summary`      | Average, p75 and p90 per metric (CLS, FCP, INP, LCP, TTFB) |
| `get_web_vitals_by_page`      | Per-page breakdown for a specific metric                   |
| `get_web_vitals_distribution` | Good/needs improvement/poor counts per metric              |
