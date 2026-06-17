import type { DbConnection } from "../../db/connection";
import type { Result } from "yawa-common";
import * as z from "zod";
import { type QueryAnalyticsParams, type QueryAnalyticsParamsWithLimit } from "./types";

const TopEventsSchema = z.strictObject({
  name: z.string(),
  count: z.coerce.number(),
  visitors: z.coerce.number(),
});

export const ListTopEventsSchema = z.array(TopEventsSchema);

const EventSeriesSchema = z.strictObject({
  date: z.string(),
  name: z.string(),
  count: z.coerce.number(),
});

export const ListEventSeriesSchema = z.array(EventSeriesSchema);

export class DbTrackEventsAnalytics {
  #connection: DbConnection;

  private constructor({ connection }: { connection: DbConnection }) {
    this.#connection = connection;
  }

  static create({ connection }: { connection: DbConnection }): DbTrackEventsAnalytics {
    return new this({ connection });
  }

  /**
   * Top event names ranked by count and unique visitors.
   */
  async getTopEvents({
    site_id,
    from,
    to,
    limit = 100,
  }: QueryAnalyticsParamsWithLimit): Promise<Result<z.infer<typeof ListTopEventsSchema>>> {
    return this.#connection.query({
      sql: `SELECT name, COUNT(*) AS count, COUNT(DISTINCT session_id) AS visitors
            FROM yawa_analytics.track_events
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
            GROUP BY name ORDER BY count DESC LIMIT $limit`,
      schema: TopEventsSchema,
      values: { site_id, from, to, limit },
    });
  }

  /**
   * Daily event counts over a date range.
   */
  async getEventSeries({
    site_id,
    from,
    to,
  }: QueryAnalyticsParams): Promise<Result<z.infer<typeof ListEventSeriesSchema>>> {
    return this.#connection.query({
      sql: `SELECT DATE_TRUNC('day', created_at)::VARCHAR AS date, name, COUNT(*) AS count
            FROM yawa_analytics.track_events
            WHERE site_id = $site_id AND created_at BETWEEN $from AND $to
            GROUP BY 1, 2 ORDER BY 1, 2`,
      schema: EventSeriesSchema,
      values: { site_id, from, to },
    });
  }
}
