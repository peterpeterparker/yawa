import type { DbConnection, DbInstance } from "yawa-db";
import type { Context, Hono } from "hono";
import * as z from "zod";
import type { Option } from "yawa-common";

export type DefineApi = (args: { db: DbInstance }) => { fetch: Hono["fetch"] };

export type ApiEnv = { Variables: { db: { connection: DbConnection } } };

type JsonInputSchema<T extends z.ZodType> = {
  in: {
    json: z.input<T>;
  };
  out: {
    json: z.infer<T>;
  };
};

export type DefineHandler<T extends z.ZodType, Env extends ApiEnv = ApiEnv> = (
  context: Context<Env, string, JsonInputSchema<T>>,
) => Promise<Option<Response>>;
