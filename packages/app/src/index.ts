import { openDb } from "yawa-db";
import { defineApp } from "./app";
import { defineInternal } from "./internal";

const dbResult = await openDb();

if (dbResult.status === "error") {
  console.error("Cannot open DB:", dbResult.err);
  process.exit(1);
}

const { result: db } = dbResult;

const { fetch: appFetch } = defineApp({ db });
const { fetch: internalFetch } = defineInternal({ db });

const apiServer = Bun.serve({
  port: 3000,
  fetch: appFetch,
  hostname: process.env.NODE_ENV === "development" ? "127.0.0.1" : "0.0.0.0",
});

const internalServer = Bun.serve({
  port: 9999,
  fetch: internalFetch,
  hostname: "127.0.0.1",
});

const close = async () => {
  try {
    await Promise.allSettled([apiServer.stop(), internalServer.stop()]);
  } finally {
    // We always close the DB no matter what
    await db.close();
  }
};

process.on("SIGINT", close);
process.on("SIGTERM", close);

console.log(`yawa running on http://localhost:${apiServer.port}`);
