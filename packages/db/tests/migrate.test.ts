import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import * as z from "zod";
import { DbInstance } from "../src/db/instance";
import { migrate } from "../src/migrate";

describe("migrate", () => {
  let instance: DbInstance;

  beforeEach(async () => {
    instance = await DbInstance.create({ type: "in-memory" });
  });

  afterEach(async () => {
    await instance.close();
  });

  test("runs migrations successfully on fresh db", async () => {
    const result = await migrate({ instance });
    expect(result.status).toBe("success");
  });

  test("is idempotent - running twice does not fail", async () => {
    await migrate({ instance });
    const result = await migrate({ instance });
    expect(result.status).toBe("success");
  });

  test("records applied migrations", async () => {
    await migrate({ instance });

    const connectionResult = await instance.connect();
    expect(connectionResult.status).toBe("success");

    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    const applied = await connectionResult.result.query({
      sql: `SELECT id, filename, executed_at FROM yawa_system.migrations ORDER BY filename`,
      schema: z.object({
        id: z.string().uuid(),
        filename: z.string(),
        executed_at: z.string(),
      }),
    });

    expect(applied.status).toBe("success");

    if (applied.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    expect(applied.result.length).toBe(2);
    expect(applied.result[0]?.filename).toBe("0001_admin.sql");
    expect(applied.result[0]?.id).toBeDefined();
    expect(applied.result[0]?.executed_at).toBeDefined();
    expect(applied.result[1]?.filename).toBe("0002_analytics.sql");
    expect(applied.result[1]?.id).toBeDefined();
    expect(applied.result[1]?.executed_at).toBeDefined();
  });
});
