import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { DbInstance } from "../../../src/db/instance";
import { DbMigration } from "../../../src/queries/transactions/migration";
import { migrate } from "../../../src/migrate";

describe("DbMigrations", () => {
  let instance: DbInstance;
  let queries: DbMigration;

  beforeEach(async () => {
    instance = await DbInstance.create({ type: "in-memory" });
    await migrate({ instance });

    const connectionResult = await instance.connect();

    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    queries = DbMigration.create({ connection: connectionResult.result });
  });

  afterEach(async () => {
    await instance.close();
  });

  test("listApplied returns applied migrations", async () => {
    const result = await queries.listApplied();

    expect(result.status).toBe("success");

    if (result.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    expect(result.result.length).toBeGreaterThan(0);
  });

  test("markApplied records a migration", async () => {
    const result = await queries.markApplied({ filename: "test_migration.sql" });
    expect(result.status).toBe("success");

    const applied = await queries.listApplied();

    if (applied.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    expect(applied.result.some(({ filename }) => filename === "test_migration.sql")).toBe(true);
  });

  test("markApplied fails for duplicate filename", async () => {
    await queries.markApplied({ filename: "duplicate.sql" });
    const result = await queries.markApplied({ filename: "duplicate.sql" });
    expect(result.status).toBe("error");
  });
});
