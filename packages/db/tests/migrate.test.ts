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

    expect(applied.result.length).toBe(4);

    expect(applied.result[0]?.filename).toBe("0001_admin.sql");
    expect(applied.result[0]?.id).toBeDefined();
    expect(applied.result[0]?.executed_at).toBeDefined();

    expect(applied.result[1]?.filename).toBe("0002_analytics.sql");
    expect(applied.result[1]?.id).toBeDefined();
    expect(applied.result[1]?.executed_at).toBeDefined();

    expect(applied.result[2]?.filename).toBe("0003_linked_sites.sql");
    expect(applied.result[2]?.id).toBeDefined();
    expect(applied.result[2]?.executed_at).toBeDefined();

    expect(applied.result[3]?.filename).toBe("0004_web_vitals_soft_navigation.sql");
    expect(applied.result[3]?.id).toBeDefined();
    expect(applied.result[3]?.executed_at).toBeDefined();
  });

  describe("0004_web_vitals_soft_navigation", () => {
    test("adds soft_navigation while preserving existing navigation types", async () => {
      await migrate({ instance });

      const connectionResult = await instance.connect();

      if (connectionResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const result = await connectionResult.result.query({
        sql: `
      SELECT enum_range(NULL::yawa_analytics.navigation_type) AS values
    `,
        schema: z.object({
          values: z.array(z.string()),
        }),
      });

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result[0]?.values).toEqual([
        "navigate",
        "reload",
        "back_forward",
        "back_forward_cache",
        "prerender",
        "restore",
        "soft_navigation",
      ]);
    });
  });
});
