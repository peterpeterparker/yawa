import { DuckDBInstance } from "@duckdb/node-api";
import { isNullish, type Nullish, type Result, tryCatch } from "yawa-common";
import { DbConnection } from "./connection";

export class DbInstance {
  #instance: DuckDBInstance;
  #connection: Nullish<DbConnection>;

  private constructor({ instance }: { instance: DuckDBInstance }) {
    this.#instance = instance;
  }

  static async create(
    args: { type: "in-memory" } | { type: "file"; path: string },
  ): Promise<DbInstance> {
    const { fn, path } =
      args.type === "in-memory"
        ? {
            fn: DuckDBInstance.create,
            path: ":memory:",
          }
        : {
            fn: DuckDBInstance.fromCache,
            path: args.path,
          };

    const instance = await fn(path, {
      TimeZone: "UTC",
    });

    return new this({ instance });
  }

  async connect(): Promise<Result<DbConnection>> {
    return tryCatch(async () => {
      if (isNullish(this.#connection)) {
        this.#connection = await DbConnection.create({ instance: this.#instance });
      }

      return this.#connection;
    });
  }

  close(): Promise<Result<void>> {
    return tryCatch(async () => {
      const closeConnection = () => {
        this.#connection?.close();
        this.#connection = null;
      };

      closeConnection();

      this.#instance.closeSync();
    });
  }
}
