import type { DefineHandler } from "../types/api";
import { isEmptyString, isNullish } from "yawa-common";
import * as z from "zod";

export const defineTracker: DefineHandler<z.ZodType<Response>> = async (context) => {
  const {
    req: { url: rawUrl },
  } = context;

  if (isEmptyString(rawUrl)) {
    return context.json({ error: "Bad Request" }, 400);
  }

  const url = URL.parse(rawUrl);

  if (isNullish(url)) {
    return context.json({ error: "Bad Request" }, 400);
  }

  const { protocol, host } = url;

  const serverUrl = `${protocol}//${host}`;

  const script = `import { init } from '${serverUrl}/static/yawa/dist/index.js';init({serverUrl:"${serverUrl}"});`;

  return context.text(script, 200, {
    "Content-Type": "application/javascript; charset=utf-8",
    "x-content-type-options": "nosniff",
    "Cache-Control": "public, max-age=604800",
  });
};
