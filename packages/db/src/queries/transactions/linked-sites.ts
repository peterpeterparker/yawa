import type { DbConnection } from "../../db/connection";
import type { Result } from "yawa-common";
import { type Analytics, AnalyticsSchema } from "yawa-schema/db";

export class DbLinkedSites {
  #connection: DbConnection;

  private constructor({ connection }: { connection: DbConnection }) {
    this.#connection = connection;
  }

  static create({ connection }: { connection: DbConnection }): DbLinkedSites {
    return new this({ connection });
  }

  async insert({
    site_id,
    hostname,
  }: Pick<Analytics["LinkedSite"], "site_id" | "hostname">): Promise<
    Result<Pick<Analytics["LinkedSite"], "id">>
  > {
    return this.#connection.runAndReturnOne({
      sql: `INSERT INTO yawa_analytics.linked_sites (site_id, hostname) VALUES ($site_id, $hostname) RETURNING id`,
      values: { site_id, hostname },
      schema: AnalyticsSchema.LinkedSiteSchema.pick({ id: true }),
    });
  }

  async findAll(): Promise<Result<Analytics["LinkedSite"][]>> {
    return this.#connection.query({
      sql: `SELECT * FROM yawa_analytics.linked_sites ORDER BY hostname`,
      schema: AnalyticsSchema.LinkedSiteSchema,
    });
  }
}
