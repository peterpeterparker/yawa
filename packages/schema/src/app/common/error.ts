import * as z from "zod";

export const ErrorSchema = z.strictObject({
  error: z.string(),
});
