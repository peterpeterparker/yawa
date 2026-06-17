CREATE SCHEMA IF NOT EXISTS yawa_analytics;

CREATE TYPE IF NOT EXISTS yawa_analytics.site_status AS ENUM ('active', 'disabled', 'archived');

CREATE TABLE IF NOT EXISTS yawa_analytics.sites (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    hostname VARCHAR NOT NULL UNIQUE,
    status yawa_analytics.site_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'UTC'),
    updated_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'UTC')
);

CREATE TABLE IF NOT EXISTS yawa_analytics.page_views (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    site_id UUID NOT NULL REFERENCES yawa_analytics.sites(id),
    session_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    title VARCHAR NOT NULL,
    href VARCHAR NOT NULL,
    referrer VARCHAR,
    time_zone VARCHAR NOT NULL,
    language VARCHAR,
    user_agent VARCHAR,
    device_inner_width USMALLINT NOT NULL,
    device_inner_height USMALLINT NOT NULL,
    device_screen_width USMALLINT,
    device_screen_height USMALLINT,
    client_browser VARCHAR,
    client_operating_system VARCHAR,
    client_device VARCHAR,
    campaign_utm_source VARCHAR,
    campaign_utm_medium VARCHAR,
    campaign_utm_campaign VARCHAR,
    campaign_utm_term VARCHAR,
    campaign_utm_content VARCHAR,
    created_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'UTC')
);

CREATE TABLE IF NOT EXISTS yawa_analytics.track_events (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    site_id UUID NOT NULL REFERENCES yawa_analytics.sites(id),
    session_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    name VARCHAR NOT NULL,
    metadata JSON,
    created_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'UTC')
);

CREATE TYPE IF NOT EXISTS yawa_analytics.performance_metric_name AS ENUM ('CLS', 'FCP', 'INP', 'LCP', 'TTFB');
CREATE TYPE IF NOT EXISTS yawa_analytics.navigation_type AS ENUM ('navigate', 'reload', 'back_forward', 'back_forward_cache', 'prerender', 'restore');

CREATE TABLE IF NOT EXISTS yawa_analytics.performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    site_id UUID NOT NULL REFERENCES yawa_analytics.sites(id),
    session_id UUID NOT NULL,
    visit_id UUID NOT NULL,
    href VARCHAR NOT NULL,
    metric_name yawa_analytics.performance_metric_name NOT NULL,
    value DOUBLE NOT NULL,
    delta DOUBLE NOT NULL,
    metric_id VARCHAR NOT NULL,
    navigation_type yawa_analytics.navigation_type,
    created_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'UTC')
);