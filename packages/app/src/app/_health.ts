import type { DefineZodHandler } from "../types/api";
import * as z from "zod";
import { createRoute } from "@hono/zod-openapi";

const HealthSchema = z.strictObject({
  status: z.literal("ok"),
});

export const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["Health"],
  responses: {
    200: {
      content: {
        "application/json": {
          schema: HealthSchema,
        },
      },
      description: "The server is healthy and online",
    },
  },
});

export const defineHealth: DefineZodHandler<typeof healthRoute> = async (context) => {
  return context.json({ status: "ok" });
};
