---
title: Configuration
description: Environment variables available to configure your yawa server.
---

| Variable              | Required    | Description                                                                                                                                        |
| --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `YAWA_SESSION_SECRET` | Recommended | Secret used to hash session IDs. If not set, random UUIDs are used instead (less accurate visitor counting).                                       |
| `YAWA_DATA_DIR`       | No          | Path where the DuckDB database file is stored. Defaults to `/data`. If modified, update the volume mount in your `docker-compose.yml` accordingly. |
