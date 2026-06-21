---
title: Connect your MCP client
description: Connect Claude Code, Codex, Mistral, Cursor, or any MCP-compatible client to your yawa server.
---

Once your server is running, connect any MCP-compatible client using the token created above.

## Claude Code

```bash
claude mcp add yawa https://your-server.com/mcp --transport http \
  --header "Authorization: Bearer YOUR_TOKEN"
```

:::tip
Add `--scope user` to make it available across all your projects.
:::

## Claude (web)

Claude web currently requires OAuth for MCP connections. Bearer token support is not yet available. Follow [this issue](https://github.com/anthropics/claude-ai-mcp/issues/10), which aims to add support for custom HTTP headers, for updates.

## Codex

```bash
export YAWA_TOKEN="YOUR_TOKEN"

codex mcp add yawa \
  --url https://your-server.com/mcp \
  --bearer-token-env-var YAWA_TOKEN
```

## Mistral (Vibe)

Go to `Context` -> `Connectors` -> `Add a Custom MCP Connector`. Enter your server URL, wait for detection, then enter your Bearer token.

## Cursor

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

Once connected, start by listing your sites:

```
List my analytics sites
What are my top pages this week?
Show me web vitals for my homepage.
Which UTM campaigns are driving the most visitors?
```
