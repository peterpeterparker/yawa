import { isEmptyString } from "yawa-common";
import { join } from "node:path";

const PROD = process.env.NODE_ENV === "production";

const DEV_DATA_DIR = join(import.meta.dir, "..", "..", "..", ".yawa");
const DEV_MIGRATIONS_DIR = join(import.meta.dir, "..", "migrations");
const DEV_BOOTSTRAP_DIR = join(import.meta.dir, "..", "bootstrap");
const DEV_SYSTEM_SQL = join(DEV_BOOTSTRAP_DIR, "system.sql");

const PROD_DATA_DIR = join(process.cwd(), "data");
const PROD_MIGRATIONS_DIR = join(process.cwd(), "migrations");
const PROD_BOOTSTRAP_DIR = join(process.cwd(), "bootstrap");
const PROD_SYSTEM_SQL = join(PROD_BOOTSTRAP_DIR, "system.sql");

export const envDataDir = (): string => {
  const dataDir = process.env.YAWA_DATA_DIR;

  if (isEmptyString(dataDir)) {
    return PROD ? PROD_DATA_DIR : DEV_DATA_DIR;
  }

  return dataDir;
};

export const envMigrationsDir = (): string => (PROD ? PROD_MIGRATIONS_DIR : DEV_MIGRATIONS_DIR);
export const envSystemSqlPath = (): string => (PROD ? PROD_SYSTEM_SQL : DEV_SYSTEM_SQL);
