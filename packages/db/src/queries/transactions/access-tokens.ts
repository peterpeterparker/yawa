import type { DbConnection } from "../../db/connection";
import type { Option, Result } from "yawa-common";
import { type Admin, AdminSchema } from "yawa-schema/db";
import * as z from "zod";

const TokenListSchema = AdminSchema.AccessTokenSchema.pick({
  id: true,
  name: true,
  expires_at: true,
  created_at: true,
  updated_at: true,
});

export const ListTokensSchema = z.array(TokenListSchema);

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

  async findAll(): Promise<Result<z.infer<typeof ListTokensSchema>>> {
    return this.#connection.query({
      sql: `SELECT id, name, expires_at, created_at, updated_at FROM yawa_admin.access_tokens ORDER BY name`,
      schema: TokenListSchema,
    });
  }

  async disable({ id }: Pick<Admin["AccessToken"], "id">): Promise<Result<void>> {
    return this.#connection.run({
      sql: `UPDATE yawa_admin.access_tokens
            SET expires_at = current_timestamp, updated_at = current_timestamp
            WHERE id = $id AND (expires_at IS NULL OR expires_at > current_timestamp)`,
      values: { id },
    });
  }
}
