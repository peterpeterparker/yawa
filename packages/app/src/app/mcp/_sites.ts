import { DbSites, ListSitesSchema } from "yawa-db";
import { McpTools, type McpToolsInitArgs } from "./_tools";
import * as z from "zod";

export class McpToolsSites extends McpTools {
  readonly #sites: DbSites;

  private constructor({ connection, server }: McpToolsInitArgs) {
    super({ server });
    this.#sites = DbSites.create({ connection });
  }

  static create(args: McpToolsInitArgs): McpToolsSites {
    return new this(args);
  }

  override registerTools() {
    this.#registerListSites();
  }

  #registerListSites() {
    this.registerTool({
      title: "list_sites",
      description:
        "Returns all registered sites with their ID and hostname. Use this to discover available site IDs before querying analytics.",
      inputSchema: z.strictObject({}),
      outputSchema: ListSitesSchema,
      fn: async () => {
        return await this.#sites.findAll();
      },
    });
  }
}
