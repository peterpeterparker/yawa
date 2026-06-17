import {
  DbTrackEventsAnalytics,
  ListEventSeriesSchema,
  ListTopEventsSchema,
  QueryAnalyticsParamsSchema,
  QueryAnalyticsParamsWithLimitSchema,
} from "yawa-db";
import { McpTools, type McpToolsInitArgs } from "./_tools";

export class McpToolsTrackEvents extends McpTools {
  readonly #analytics: DbTrackEventsAnalytics;

  private constructor(args: McpToolsInitArgs) {
    super(args);
    this.#analytics = DbTrackEventsAnalytics.create({ connection: args.connection });
  }

  static create(args: McpToolsInitArgs): McpToolsTrackEvents {
    return new this(args);
  }

  override registerTools() {
    this.#registerGetTopEvents();
    this.#registerGetEventSeries();
  }

  #registerGetTopEvents() {
    this.registerTool({
      title: "get_top_events",
      description:
        "Returns custom event names ranked by count and unique visitors. Useful for identifying which user actions occur most frequently.",
      inputSchema: QueryAnalyticsParamsWithLimitSchema,
      outputSchema: ListTopEventsSchema,
      fn: async ({ site_id, from, to, limit }) => {
        return await this.#analytics.getTopEvents({ site_id, from, to, limit });
      },
    });
  }

  #registerGetEventSeries() {
    this.registerTool({
      title: "get_event_series",
      description:
        "Returns daily counts per event name over a date range. Useful for tracking trends in custom events over time.",
      inputSchema: QueryAnalyticsParamsSchema,
      outputSchema: ListEventSeriesSchema,
      fn: async ({ site_id, from, to }) => {
        return await this.#analytics.getEventSeries({ site_id, from, to });
      },
    });
  }
}
