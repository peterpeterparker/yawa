import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { DbInstance } from "../../../src";
import { DbSites } from "../../../src/queries/transactions/sites";
import { migrate } from "../../../src/migrate";
import * as z from "zod";

describe("DbSites", () => {
  let instance: DbInstance;
  let queries: DbSites;

  beforeEach(async () => {
    instance = await DbInstance.create({ type: "in-memory" });
    await migrate({ instance });

    const connectionResult = await instance.connect();

    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    queries = DbSites.create({ connection: connectionResult.result });
  });

  afterEach(async () => {
    await instance.close();
  });

  describe("insert", () => {
    test("inserts a site and returns its id", async () => {
      const result = await queries.insert({ hostname: "example.com" });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.id).toBeDefined();
    });

    test("fails for duplicate hostname", async () => {
      await queries.insert({ hostname: "example.com" });
      const result = await queries.insert({ hostname: "example.com" });
      expect(result.status).toBe("error");
    });
  });

  describe("findActiveByHostname", () => {
    test("returns site when active", async () => {
      await queries.insert({ hostname: "example.com" });

      const result = await queries.findActiveByHostname({ hostname: "example.com" });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result?.hostname).toBe("example.com");
      expect(result.result?.status).toBe("active");
    });

    test("returns undefined when not found", async () => {
      const result = await queries.findActiveByHostname({ hostname: "nonexistent.com" });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toBeUndefined();
    });

    test("returns undefined when disabled", async () => {
      await queries.insert({ hostname: "example.com" });

      const connectionResult = await instance.connect();
      if (connectionResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      await connectionResult.result.run({
        sql: `UPDATE yawa_analytics.sites SET status = 'disabled' WHERE hostname = $hostname`,
        values: { hostname: "example.com" },
      });

      const result = await queries.findActiveByHostname({ hostname: "example.com" });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toBeUndefined();
    });
  });

  describe("findAll", () => {
    test("returns empty array when no sites", async () => {
      const result = await queries.findAll();

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toHaveLength(0);
    });

    test("returns all sites", async () => {
      await queries.insert({ hostname: "example.com" });
      await queries.insert({ hostname: "another.com" });

      const result = await queries.findAll();

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toHaveLength(2);
      const hostnames = result.result.map((s) => s.hostname);
      expect(hostnames).toContain("example.com");
      expect(hostnames).toContain("another.com");
    });

    test("returns id, hostname and status", async () => {
      await queries.insert({ hostname: "example.com" });

      const result = await queries.findAll();

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result[0]).toHaveProperty("id");
      expect(result.result[0]).toHaveProperty("hostname");
      expect(result.result[0]).toHaveProperty("status");
      expect(result.result[0]?.status).toBe("active");
    });
  });

  describe("updateStatus", () => {
    test("updates the status of a site", async () => {
      const insertResult = await queries.insert({ hostname: "example.com" });

      expect(insertResult.status).toBe("success");
      if (insertResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const { id } = insertResult.result;

      const updateResult = await queries.updateStatus({ id, status: "disabled" });

      expect(updateResult.status).toBe("success");

      const findResult = await queries.findAll();

      expect(findResult.status).toBe("success");

      if (findResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(findResult.result[0]?.status).toBe("disabled");
    });

    test("updates the updated_at timestamp", async () => {
      const insertResult = await queries.insert({ hostname: "example.com" });

      expect(insertResult.status).toBe("success");
      if (insertResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const { id } = insertResult.result;

      const connectionResult = await instance.connect();

      if (connectionResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const beforeResult = await connectionResult.result.queryOne({
        sql: `SELECT updated_at FROM yawa_analytics.sites WHERE id = $id`,
        schema: z.object({ updated_at: z.string() }),
        values: { id },
      });

      if (beforeResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 10));

      await queries.updateStatus({ id, status: "disabled" });

      const afterResult = await connectionResult.result.queryOne({
        sql: `SELECT updated_at FROM yawa_analytics.sites WHERE id = $id`,
        schema: z.object({ updated_at: z.string() }),
        values: { id },
      });

      if (afterResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(afterResult.result?.updated_at).not.toBe(beforeResult.result?.updated_at);
    });

    test("fails for nonexistent id", async () => {
      const result = await queries.updateStatus({
        id: "01912d4e-1234-7000-8000-000000000000",
        status: "disabled",
      });

      expect(result.status).toBe("success");
    });
  });
});
