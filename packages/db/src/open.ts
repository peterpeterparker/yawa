import { type Result, tryCatch } from "yawa-common";
import { DbInstance } from "./db/instance";
import { join } from "node:path";
import { mkdir } from "node:fs/promises";
import { migrate } from "./migrate";
import { envDataDir } from "./env";

export const openDb = async (): Promise<Result<DbInstance>> => {
  const instanceResult = await tryCatch(async () => {
    return await createInstance();
  });

  if (instanceResult.status === "error") {
    return instanceResult;
  }

  const { result: instance } = instanceResult;

  const migrationResult = await migrate({ instance });

  if (migrationResult.status === "error") {
    return migrationResult;
  }

  return { status: "success", result: instance };
};

const createInstance = async (): Promise<DbInstance> => {
  const dbDir = envDataDir();

  try {
    await mkdir(dbDir, { recursive: true });
  } catch (err: unknown) {
    console.error(`Failed to create ${dbDir} directory:`, err);
    process.exit(1);
  }

  return await DbInstance.create({
    type: "file",
    path: join(dbDir, "yawa.db"),
  });
};
