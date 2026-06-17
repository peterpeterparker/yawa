import type { DbConnection } from "../../db/connection";
import type { Result } from "yawa-common";
import { type Analytics, AnalyticsSchema } from "yawa-schema/db";

export class DbPerformanceMetrics {
  #connection: DbConnection;

  private constructor({ connection }: { connection: DbConnection }) {
    this.#connection = connection;
  }

  static create({ connection }: { connection: DbConnection }): DbPerformanceMetrics {
    return new this({ connection });
  }

  async insert(
    metric: Omit<Analytics["PerformanceMetric"], "id" | "created_at">,
  ): Promise<Result<Pick<Analytics["PerformanceMetric"], "id">>> {
    return this.#connection.runAndReturnOne({
      sql: `INSERT INTO yawa_analytics.performance_metrics (
        site_id, session_id, visit_id, href, metric_name, value, delta, metric_id, navigation_type
      ) VALUES (
        $site_id, $session_id, $visit_id, $href, $metric_name, $value, $delta, $metric_id, $navigation_type
      ) RETURNING id`,
      schema: AnalyticsSchema.PerformanceMetricSchema.pick({ id: true }),
      values: metric,
    });
  }
}
