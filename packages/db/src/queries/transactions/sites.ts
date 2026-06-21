import type { DbConnection } from "../../db/connection";
import type { Option, Result } from "yawa-common";
import { type Analytics, AnalyticsSchema } from "yawa-schema/db";
import * as z from "zod";

const SiteSchema = AnalyticsSchema.SiteSchema.pick({ id: true, hostname: true, status: true });

export const LitSitesSchema = z.array(SiteSchema);

export class DbSites {
  #connection: DbConnection;

  private constructor({ connection }: { connection: DbConnection }) {
    this.#connection = connection;
  }

  static create({ connection }: { connection: DbConnection }): DbSites {
    return new this({ connection });
  }

  async insert({
    hostname,
  }: Pick<Analytics["Site"], "hostname">): Promise<Result<Pick<Analytics["Site"], "id">>> {
    return this.#connection.runAndReturnOne({
      sql: `INSERT INTO yawa_analytics.sites (hostname) VALUES ($hostname) RETURNING id`,
      values: { hostname },
      schema: AnalyticsSchema.SiteSchema.pick({ id: true }),
    });
  }

  async findActiveByHostname({
    hostname,
  }: Pick<Analytics["Site"], "hostname">): Promise<Result<Option<Analytics["Site"]>>> {
    return this.#connection.queryOne({
      sql: `SELECT * FROM yawa_analytics.sites WHERE hostname = $hostname AND status = 'active'`,
      schema: AnalyticsSchema.SiteSchema,
      values: { hostname },
    });
  }

  async findAll(): Promise<Result<z.infer<typeof LitSitesSchema>>> {
    return this.#connection.query({
      sql: `SELECT id, hostname, status FROM yawa_analytics.sites ORDER BY hostname`,
      schema: AnalyticsSchema.SiteSchema.pick({ id: true, hostname: true, status: true }),
    });
  }

  async updateStatus({
    id,
    status,
  }: Pick<Analytics["Site"], "id" | "status">): Promise<Result<void>> {
    return this.#connection.run({
      sql: `UPDATE yawa_analytics.sites SET status = $status, updated_at = current_timestamp WHERE id = $id`,
      values: { id, status },
    });
  }
}
