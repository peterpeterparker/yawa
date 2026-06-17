import * as z from "zod";
import { AdminSchema } from "../../db";

export const CreateTokenRequestSchema = z.strictObject({
  name: AdminSchema.AccessTokenSchema.shape.name.min(1),
  expires_at: z.iso.date().optional(),
});

export const CreateTokenRequestCodec = z.codec(CreateTokenRequestSchema, z.string(), {
  decode: (args) => JSON.stringify(args),
  encode: (json) => JSON.parse(json),
});

export const CreateTokenResponseSchema = z.strictObject({
  token: z.string(),
});
