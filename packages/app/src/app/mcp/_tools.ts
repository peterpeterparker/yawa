// eslint-disable-next-line import/extensions
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { type Result } from "yawa-common";
import * as z from "zod";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import type { DbConnection } from "yawa-db";

export interface McpToolsInitArgs {
  connection: DbConnection;
  server: McpServer;
}

export abstract class McpTools {
  readonly #server: McpServer;

  protected constructor({ server }: { server: McpServer }) {
    this.#server = server;
  }

  abstract registerTools(): void;

  protected registerTool<T, R>({
    title,
    description,
    inputSchema,
    outputSchema,
    fn,
  }: {
    title: string;
    description: string;
    inputSchema: z.ZodType<T>;
    outputSchema: z.ZodType<R>;
    fn: (args: T) => Promise<Result<R>>;
  }): void {
    this.#server.registerTool(
      title,
      { description, inputSchema, outputSchema: z.strictObject({ result: outputSchema }) },
      async (args): Promise<CallToolResult> => {
        const fnResult = await fn(args);

        if (fnResult.status === "error") {
          const { err } = fnResult;

          return {
            isError: true,
            content: [
              {
                type: "text",
                text: err instanceof Error ? err.message : "An unexpected error occurred.",
              },
            ],
          };
        }

        const { result } = fnResult;

        return {
          structuredContent: { result },
          content: [{ type: "text", text: JSON.stringify(result) }],
        };
      },
    );
  }
}
