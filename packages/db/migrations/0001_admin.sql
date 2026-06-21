CREATE SCHEMA IF NOT EXISTS yawa_admin;

CREATE TABLE IF NOT EXISTS yawa_admin.access_tokens (
    id UUID PRIMARY KEY DEFAULT uuidv7(),
    name VARCHAR NOT NULL UNIQUE,
    token_hash VARCHAR NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT current_timestamp,
    updated_at TIMESTAMP DEFAULT current_timestamp,
    expires_at TIMESTAMP
);