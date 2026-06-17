import type { Result } from "yawa-common";
import type { System } from "yawa-schema/db";
import { SystemSchema } from "yawa-schema/db";
import type { DbConnection } from "../../db/connection";

type AppliedScript = Pick<System["Migration"], "filename">;

export class DbMigration {
  #connection: DbConnection;

  private constructor({ connection }: { connection: DbConnection }) {
    this.#connection = connection;
  }

  static create({ connection }: { connection: DbConnection }): DbMigration {
    return new this({ connection });
  }

  async listApplied(): Promise<Result<AppliedScript[]>> {
    return this.#connection.query<AppliedScript>({
      sql: `SELECT filename FROM yawa_system.migrations`,
      schema: SystemSchema.MigrationSchema.pick({ filename: true }),
    });
  }

  async markApplied({ filename }: { filename: string }): Promise<Result<void>> {
    return this.#connection.run({
      sql: `INSERT INTO yawa_system.migrations (filename) VALUES ('${filename}')`,
    });
  }
}
