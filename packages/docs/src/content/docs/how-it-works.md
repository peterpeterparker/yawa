---
title: How it works
description: Learn how yawa collects, stores, and exposes your analytics data.
---

yawa has three moving parts.

Your **app or website** sends analytics with a lightweight JavaScript library (`yawa-tracker`) that collects page views, custom events and Web Vitals.

On **your self-hosted server**, you deploy a Docker container that exposes an API and MCP server. It receives the events and stores them in an embedded [DuckDB](https://duckdb.org) database, and provides 26+ analytics tools over the Model Context Protocol.

Lastly, connect your **MCP client** (Claude Code, Cursor, or any MCP-compatible client) to your endpoint and query your data in natural language.
