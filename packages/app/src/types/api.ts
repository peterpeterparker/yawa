import type { DbConnection, DbInstance } from "yawa-db";
import type { Context, Hono } from "hono";
import * as z from "zod";
import type { Option } from "yawa-common";
import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";

export type DefineApi = (args: { db: DbInstance }) => {
  fetch: Hono["fetch"] | OpenAPIHono["fetch"];
};

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

export type DefineZodHandler<R extends RouteConfig, E extends ApiEnv = ApiEnv> = RouteHandler<R, E>;
