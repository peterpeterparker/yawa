import type { DbConnection } from "../../db/connection";
import type { Result } from "yawa-common";
import { type Analytics, AnalyticsSchema } from "yawa-schema/db";

export class DbTrackEvents {
  #connection: DbConnection;

  private constructor({ connection }: { connection: DbConnection }) {
    this.#connection = connection;
  }

  static create({ connection }: { connection: DbConnection }): DbTrackEvents {
    return new this({ connection });
  }

  async insert(
    trackEvent: Omit<Analytics["TrackEvent"], "id" | "created_at">,
  ): Promise<Result<Pick<Analytics["TrackEvent"], "id">>> {
    return this.#connection.runAndReturnOne({
      sql: `INSERT INTO yawa_analytics.track_events (
        site_id, session_id, visit_id, name, metadata
      ) VALUES (
        $site_id, $session_id, $visit_id, $name, $metadata::JSON
      ) RETURNING id`,
      schema: AnalyticsSchema.TrackEventSchema.pick({ id: true }),
      values: {
        ...trackEvent,
        metadata: trackEvent.metadata ? JSON.stringify(trackEvent.metadata) : null,
      },
    });
  }
}
