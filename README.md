# yawa - Yet Another Web Analytics

> [!IMPORTANT]  
> yawa is in early development. APIs, configuration, and data formats may change without notice. Use in production at your own risk.

yawa is a self-hosted web analytics platform with no UI. Instead of dashboards, you query your data through the [Model Context Protocol (MCP)](https://modelcontextprotocol.io), asking Claude or any compatible AI client questions about your traffic in plain language.

```
"List my analytics sites"
"What are my top pages this week?"
"Show me web vitals for my homepage."
"Which UTM campaigns are driving the most visitors?"
```

It, obviously, requires no cookie banners or GDPR consent. Its tracking script is also super tiny.

## How it works

Yet another web analytics has three moving parts.

Your **app or website** sends analytics with a lightweight JavaScript library (`yawa`) that collects page views, custom events and Web Vitals.

On **your self-hosted server**, you deploy a Docker container that exposes an API and MCP server. It receives the events and stores them in an embedded [DuckDB](https://duckdb.org) database, and provides 26+ analytics tools over the Model Context Protocol.

Lastly, connect your **MCP client** (Claude Code/Desktop, Codex, or any MCP-compatible client) to your endpoint and query your data in natural language.

## Quick Start

Run the server on any VPS or locally if you just want to give it a spin.

1. Create a `docker-compose.yml`

```yaml
services:
  app:
    image: peterpeterparker/yawa:latest
    ports:
      - "3000:3000"
    volumes:
      - yawa-data:/data
    environment:
      - YAWA_SESSION_SECRET=${YAWA_SESSION_SECRET}
    restart: unless-stopped

volumes:
  yawa-data:
```

2. Generate a secret

Optional, but improves visitor counting accuracy when generating the session IDs.

```bash
echo "YAWA_SESSION_SECRET=$(openssl rand -base64 32)" > .env
```

3. Start the server

```bash
docker compose up -d
```

## Create an access token

> [!NOTE]
> Tokens are used to authenticate the MCP client.

```bash
docker exec -it <container-name> ./cli token create --name mytoken
```

Copy the token - it will only be shown once.

## Register your site

> [!NOTE]
> yawa supports multiple sites.

```bash
docker exec -it <container-name> ./cli site create --hostname yourdomain.com
```

## Connect your MCP client

Once your server is running, connect any MCP-compatible client using the token created above.

### Claude Code

```bash
claude mcp add yawa https://your-server.com/mcp --transport http \
  --header "Authorization: Bearer YOUR_TOKEN"
```

> [!TIP]
> Add `--scope user` to make it available across all your projects.

### Cursor

Add to your `mcp.json`:

```json
{
  "mcpServers": {
    "yawa": {
      "url": "https://your-server.com/mcp",
      "headers": {
        "Authorization": "Bearer YOUR_TOKEN"
      }
    }
  }
}
```

### Claude (web)

Claude web currently requires OAuth for MCP connections. Bearer token support is not yet available. Follow [this issue](https://github.com/anthropics/claude-ai-mcp/issues/10), which aims to add support for custom HTTP headers, for updates.

Once connected, start by listing your sites:

```
List my analytics sites
Show me stats for yourdomain.com for the last 30 days
What are my top pages this week?
```

## Install the tracker

Install the tracker in your website or frontend app:

```bash
npm install yawa-tracker
```

### Setup

```ts
import { init } from "yawa-tracker";

const cleanup = init({
  serverUrl: "https://your-yawa-server.com",
});
```

This automatically tracks page views on load and navigation (SPA-friendly via `history.pushState` and `popstate`).

### Custom events

To track a custom event, call `trackEvent` with a name and optional metadata:

```ts
import { trackEvent } from "yawa-tracker";

trackEvent({ name: "signup", metadata: { plan: "pro" } });
```

Keys and values must be strings, with a maximum of 10 keys and 200 characters per key/value.

### Web Vitals

Core Web Vitals (CLS, FCP, INP, LCP, TTFB) can also be collected by enabling the option when initializing the tracker:

```ts
import { init } from "yawa-tracker";

const cleanup = init({
  serverUrl: "https://your-yawa-server.com",
  webVitals: true,
});
```

### API

| Function                | Description                                         |
| ----------------------- | --------------------------------------------------- |
| `init(options)`         | Initialize the tracker. Returns a cleanup function. |
| `trackPageView()`       | Fire-and-forget page view tracking.                 |
| `trackPageViewAsync()`  | Async page view tracking.                           |
| `trackEvent(data)`      | Fire-and-forget custom event.                       |
| `trackEventAsync(data)` | Async custom event.                                 |

### Options

| Option      | Required | Description                                      |
| ----------- | -------- | ------------------------------------------------ |
| `serverUrl` | Yes      | URL of your yawa server.                         |
| `webVitals` | No       | Enable Web Vitals tracking. Defaults to `false`. |

## MCP tools

Once connected, the following tools are available:

### Sites

| Tool         | Description                              |
| ------------ | ---------------------------------------- |
| `list_sites` | List all registered sites with their IDs |

### Page views

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

### Custom events

| Tool               | Description                          |
| ------------------ | ------------------------------------ |
| `get_top_events`   | Custom event names ranked by count   |
| `get_event_series` | Daily event counts over a date range |

### Web Vitals

| Tool                          | Description                                                |
| ----------------------------- | ---------------------------------------------------------- |
| `get_web_vitals_summary`      | Average, p75 and p90 per metric (CLS, FCP, INP, LCP, TTFB) |
| `get_web_vitals_by_page`      | Per-page breakdown for a specific metric                   |
| `get_web_vitals_distribution` | Good/needs improvement/poor counts per metric              |

## Configuration

| Variable              | Required    | Description                                                                                                                                        |
| --------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `YAWA_SESSION_SECRET` | Recommended | Secret used to hash session IDs. If not set, random UUIDs are used instead (less accurate visitor counting).                                       |
| `YAWA_DATA_DIR`       | No          | Path where the DuckDB database file is stored. Defaults to `/data`. If modified, update the volume mount in your `docker-compose.yml` accordingly. |

## Development

Clone the repo and run the app locally.

### Setup

```bash
git clone https://github.com/peterpeterparker/yawa.git
cd yawa
bun install --frozen-lockfile
```

### Run locally

```bash
bun run --filter yawa-app dev
```

The app server starts on `http://localhost:3000` (events and MCP) and `http://localhost:9999` (CLI only).

### CLI

```bash
bun run --filter yawa-cli dev token create --name test
bun run --filter yawa-cli dev site create --hostname localhost
```

### Run tests

```bash
bun test
```

### Build

```bash
bun run --filter yawa-app build
```

## License

MIT
