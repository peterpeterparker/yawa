import * as z from "zod";
import { IdSchema, TimestampSchema } from "./common";

export const MigrationSchema = z.strictObject({
  id: IdSchema,
  filename: z.string(),
  executed_at: TimestampSchema,
});
