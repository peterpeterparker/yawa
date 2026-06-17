import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { version } from "../../../package.json";
import { StreamableHTTPTransport } from "@hono/mcp";
import { type Option, type Result, tryCatch } from "yawa-common";
import type { DbConnection } from "yawa-db";
import { McpToolsPageViews } from "./_page-views";
import { McpToolsSites } from "./_sites";
import { McpToolsTrackEvents } from "./_track-events";
import { McpToolsPerformanceMetrics } from "./_performance-metrics";
import type { Context } from "hono";

export class McpHandler {
  readonly #server: McpServer;

  private constructor() {
    this.#server = new McpServer({ name: "yawa", version });
  }

  static create(args: { connection: DbConnection }): McpHandler {
    const instance = new this();
    instance.#registerTools(args);
    return instance;
  }

  #registerTools({ connection }: { connection: DbConnection }) {
    McpToolsSites.create({ connection, server: this.#server }).registerTools();
    McpToolsPageViews.create({ connection, server: this.#server }).registerTools();
    McpToolsTrackEvents.create({ connection, server: this.#server }).registerTools();
    McpToolsPerformanceMetrics.create({ connection, server: this.#server }).registerTools();
  }

  async handleRequest({
    context,
    __useJsonResponseForTest__ = false,
  }: {
    context: Context;
    __useJsonResponseForTest__?: boolean;
  }): Promise<Result<Option<Response>>> {
    return await tryCatch(async (): Promise<Option<Response>> => {
      const transport = new StreamableHTTPTransport({
        // stateless mode: we don't need to share context across requests
        sessionIdGenerator: undefined,
        // returns simple json response is useful for testing purposes
        enableJsonResponse: __useJsonResponseForTest__,
      });

      await this.#server.connect(transport);

      return await transport.handleRequest(context);
    });
  }
}
