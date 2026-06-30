CREATE TABLE IF NOT EXISTS yawa_analytics.additional_sites (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    site_id UUID NOT NULL REFERENCES yawa_analytics.sites(id),
    hostname VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp
);
