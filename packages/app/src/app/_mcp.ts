import type { DefineHandler } from "../types/api";
import { McpHandler } from "./mcp/mcp";
import * as z from "zod";
import type { Option } from "yawa-common";

// We use @hono/mcp (https://github.com/honojs/middleware/tree/main/packages/mcp)
// instead of @modelcontextprotocol/sdk because it patches an issue for using the MCP server
// with some clients such as Claude Code.
// References:
// - https://github.com/honojs/middleware/pull/1774
// - https://github.com/honojs/middleware/issues/1773#issuecomment-4193499002
// - https://github.com/anthropics/claude-code/issues/42470
export const defineMcp: DefineHandler<z.ZodType<Option<Response>>> = async (context) => {
  const {
    var: {
      db: { connection },
    },
  } = context;

  const result = await McpHandler.create({ connection }).handleRequest({ context });

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Internal server error" }, 500);
  }

  const { result: response } = result;
  return response;
};
