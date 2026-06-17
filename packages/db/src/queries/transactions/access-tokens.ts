import type { DbConnection } from "../../db/connection";
import type { Option, Result } from "yawa-common";
import { type Admin, AdminSchema } from "yawa-schema/db";

export class DbAccessTokens {
  #connection: DbConnection;

  private constructor({ connection }: { connection: DbConnection }) {
    this.#connection = connection;
  }

  static create({ connection }: { connection: DbConnection }): DbAccessTokens {
    return new this({ connection });
  }

  async insert({
    name,
    token_hash,
    expires_at,
  }: Omit<Admin["AccessToken"], "id" | "created_at" | "updated_at">): Promise<Result<void>> {
    return this.#connection.run({
      sql: `INSERT INTO yawa_admin.access_tokens (name, token_hash, expires_at)
                  VALUES ($name, $token_hash, $expires_at)`,
      values: { name, token_hash, expires_at: expires_at ?? null },
    });
  }

  async findValidByHash({
    token_hash,
  }: Pick<Admin["AccessToken"], "token_hash">): Promise<Result<Option<Admin["AccessToken"]>>> {
    return this.#connection.queryOne({
      sql: `SELECT * FROM yawa_admin.access_tokens WHERE token_hash = $token_hash AND (expires_at IS NULL OR expires_at > current_timestamp)`,
      schema: AdminSchema.AccessTokenSchema,
      values: { token_hash },
    });
  }
}
