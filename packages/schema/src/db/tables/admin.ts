import * as z from "zod";
import { IdSchema, TimestampSchema } from "./common";

export const AccessTokenSchema = z.strictObject({
  id: IdSchema,
  name: z.string(),
  token_hash: z.string(),
  created_at: TimestampSchema,
  updated_at: TimestampSchema,
  expires_at: TimestampSchema.nullable(),
});
