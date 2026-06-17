import type { DefineHandler } from "../types/api";
import { InternalSchema } from "yawa-schema/app";
import { DbAccessTokens } from "yawa-db";
import { generateToken } from "./utils/token";

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
