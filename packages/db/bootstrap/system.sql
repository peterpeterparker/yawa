CREATE SCHEMA IF NOT EXISTS yawa_system;

CREATE TABLE IF NOT EXISTS yawa_system.migrations (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    filename VARCHAR NOT NULL UNIQUE,
    executed_at TIMESTAMP DEFAULT (now() AT TIME ZONE 'UTC')
);
