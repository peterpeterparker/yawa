import type { DefineHandler } from "../types/api";
import { InternalSchema } from "yawa-schema/app";
import { DbAccessTokens } from "yawa-db";
import { generateToken } from "./utils/token";
import { isEmptyString } from "yawa-common";

export const defineCreateToken: DefineHandler<
  typeof InternalSchema.Token.CreateTokenRequestSchema
> = async (context) => {
  const {
    req,
    var: {
      db: { connection },
    },
  } = context;

  const { name, expires_at } = req.valid("json");

  const { token, hash } = await generateToken();

  const result = await DbAccessTokens.create({ connection }).insert({
    name,
    token_hash: hash,
    expires_at: expires_at ?? null,
  });

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to create token" }, 500);
  }

  return context.json({ token });
};

export const defineDisableToken: DefineHandler<never> = async (context) => {
  const {
    req,
    var: {
      db: { connection },
    },
  } = context;

  const id = req.param("id");

  if (isEmptyString(id)) {
    return context.json({ error: "Bad Request" }, 400);
  }

  const result = await DbAccessTokens.create({ connection }).disable({ id });

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to disable token" }, 500);
  }

  return context.newResponse(null, 204);
};

export const defineListTokens: DefineHandler<never> = async (context) => {
  const {
    var: {
      db: { connection },
    },
  } = context;

  const result = await DbAccessTokens.create({ connection }).findAll();

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to list tokens" }, 500);
  }

  const { result: tokens } = result;

  return context.json({ tokens });
};
