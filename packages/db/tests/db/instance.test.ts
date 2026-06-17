import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { DbInstance } from "../../src/db/instance";

describe("DbInstance", () => {
  let instance: DbInstance;

  beforeEach(async () => {
    instance = await DbInstance.create({ type: "in-memory" });
  });

  afterEach(async () => {
    await instance.close();
  });

  test("creates an in-memory instance", async () => {
    expect(instance).toBeDefined();
  });

  test("connects successfully", async () => {
    const result = await instance.connect();
    expect(result.status).toBe("success");
  });

  test("returns the same connection on multiple connect calls", async () => {
    const first = await instance.connect();
    const second = await instance.connect();

    expect(first.status).toBe("success");
    expect(second.status).toBe("success");

    if (first.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    if (second.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    expect(first.result).toBe(second.result);
  });

  test("closes successfully", async () => {
    await instance.connect();
    const result = await instance.close();
    expect(result.status).toBe("success");
  });
});
