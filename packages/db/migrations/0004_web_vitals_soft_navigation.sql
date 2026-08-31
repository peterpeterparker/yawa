-- Extend the navigation type with the "soft-navigation" type introduced in web-vitals@v6.
-- Note: DuckDB does not support altering an enum type, e.g.
-- ALTER TYPE yawa_analytics.navigation_type ADD VALUE 'soft_navigation';
-- Therefore, the entire type needs to be recreated.
CREATE OR REPLACE TYPE yawa_analytics.navigation_type AS ENUM ('navigate', 'reload', 'back_forward', 'back_forward_cache', 'prerender', 'restore', 'soft_navigation');