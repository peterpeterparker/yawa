import type { DefineHandler } from "../types/api";
import { DbLinkedSites } from "yawa-db";

export const defineListLinkedSites: DefineHandler<never> = async (context) => {
  const {
    var: {
      db: { connection },
    },
  } = context;

  const result = await DbLinkedSites.create({ connection }).findAll();

  if (result.status === "error") {
    console.error(result.err);
    return context.json({ error: "Failed to list linked sites" }, 500);
  }

  const { result: linkedSites } = result;

  return context.json({ linkedSites });
};
