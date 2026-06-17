import type { DefineHandler } from "../types/api.ts";
import * as z from "zod";

const HealthSchema = z.strictObject({
  status: z.literal("ok"),
});

export const defineHealth: DefineHandler<typeof HealthSchema> = async (context) => {
  return context.json({ status: "ok" });
};
