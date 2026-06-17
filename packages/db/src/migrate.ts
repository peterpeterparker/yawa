import type { DbInstance } from "./db/instance";
import { type Result, safeExec, tryCatch } from "yawa-common";
import { join, extname } from "node:path";
import { readdir } from "node:fs/promises";
import { type System } from "yawa-schema/db";
import type { DbConnection } from "./db/connection";
import type { Dirent } from "node:fs";
import { DbMigration } from "./queries/transactions/migration";
import { envMigrationsDir, envSystemSqlPath } from "./env.ts";

interface DbMigrateArgs {
  instance: DbInstance;
}

interface DbMigrateFnArgs {
  connection: DbConnection;
}

export const migrate = async (args: DbMigrateArgs): Promise<Result<void>> => {
  return await migrateDb(args);
};

const migrateDb = async ({ instance }: DbMigrateArgs): Promise<Result<void>> => {
  // 1. Connect to the DB instance
  const connectionResult = await instance.connect();

  if (connectionResult.status === "error") {
    return connectionResult;
  }

  const { result: connection } = connectionResult;

  // 2. Bootstrap - if not exists yet - the system schema (which tracks the migration scripts)
  const bootstrapResult = await bootstrapSysSchema({ connection });

  if (bootstrapResult.status === "error") {
    return bootstrapResult;
  }

  // 3. List all already applied migration scripts
  const appliedScriptsResult = await DbMigration.create({ connection }).listApplied();

  if (appliedScriptsResult.status === "error") {
    return appliedScriptsResult;
  }

  const { result: applied } = appliedScriptsResult;

  // 4. List all scripts to execute
  const listResult = await listMigrationsFiles({ applied });

  if (listResult.status === "error") {
    return listResult;
  }

  const {
    result: { files },
  } = listResult;

  for (const file of files) {
    const applyResult = await safeExec(async () => {
      return applyMigrationScript({ file, connection });
    });

    if (applyResult.status === "error") {
      return applyResult;
    }

    console.log(`Applied migration: ${file.name}`);
  }

  return { status: "success", result: undefined };
};

const bootstrapSysSchema = async ({ connection }: DbMigrateFnArgs): Promise<Result<void>> => {
  return await safeExec(async () => {
    const bootstrapSql = await Bun.file(envSystemSqlPath()).text();
    return await connection.run({ sql: bootstrapSql });
  });
};

type AppliedScript = Pick<System["Migration"], "filename">;

const listMigrationsFiles = async ({
  applied,
}: {
  applied: AppliedScript[];
}): Promise<Result<{ files: Dirent[] }>> => {
  return await tryCatch(async () => {
    const appliedFilenames = new Set(applied.map(({ filename }) => filename));

    const files = (await readdir(envMigrationsDir(), { withFileTypes: true }))
      .filter((file) => file.isFile())
      .filter((file) => extname(file.name) === ".sql")
      .filter((file) => !appliedFilenames.has(file.name))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { files };
  });
};

const applyMigrationScript = async ({
  connection,
  file,
}: DbMigrateFnArgs & { file: Dirent }): Promise<Result<void>> => {
  const sql = await Bun.file(join(file.parentPath, file.name)).text();

  const migrateResult = await connection.run({ sql });

  if (migrateResult.status === "error") {
    return migrateResult;
  }

  const saveResult = await DbMigration.create({ connection }).markApplied({
    filename: file.name,
  });

  if (saveResult.status === "error") {
    return saveResult;
  }

  return { status: "success", result: undefined };
};
