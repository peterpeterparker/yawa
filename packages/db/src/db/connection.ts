import { DuckDBConnection, DuckDBInstance, type DuckDBValue } from "@duckdb/node-api";
import { type Option, type Result, safeExec, tryCatch } from "yawa-common";
import * as z from "zod";

export class DbConnection {
  #connection: DuckDBConnection;

  constructor({ connection }: { connection: DuckDBConnection }) {
    this.#connection = connection;
  }

  static async create({ instance }: { instance: DuckDBInstance }): Promise<DbConnection> {
    const connection = await instance.connect();
    return new this({ connection });
  }

  close() {
    this.#connection.closeSync();
  }

  async run({
    sql,
    values,
  }: {
    sql: string;
    values?: Record<string, DuckDBValue>;
  }): Promise<Result<void>> {
    return tryCatch(async () => {
      await this.#connection.run(sql, values);
    });
  }

  async runAndReturnOne<T>({
    sql,
    schema,
    values,
  }: {
    sql: string;
    schema: z.ZodType<T>;
    values?: Record<string, DuckDBValue>;
  }): Promise<Result<T>> {
    const result = await this.queryOne({ sql, schema, values });

    if (result.status === "error") {
      return result;
    }

    const { result: data } = result;

    return await safeExec(async (): Promise<Result<T>> => {
      const result = schema.nonoptional().parse(data);
      return { status: "success", result };
    });
  }

  async query<T>({
    sql,
    schema,
    values,
  }: {
    sql: string;
    schema: z.ZodType<T>;
    values?: Record<string, DuckDBValue>;
  }): Promise<Result<T[]>> {
    return tryCatch(async () => {
      const reader = await this.#connection.runAndReadAll(sql, values);
      return reader.getRowObjectsJson().map((row) => schema.parse(row));
    });
  }

  async queryOne<T>({
    schema,
    ...rest
  }: {
    sql: string;
    schema: z.ZodType<T>;
    values?: Record<string, DuckDBValue>;
  }): Promise<Result<Option<T>>> {
    const result = await this.query({ schema, ...rest });

    if (result.status === "error") {
      return result;
    }

    const { result: data } = result;

    return await safeExec(async (): Promise<Result<Option<T>>> => {
      const results = z.array(schema).min(0).max(1).parse(data);
      return { status: "success", result: results[0] };
    });
  }
}
