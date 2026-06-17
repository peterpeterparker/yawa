import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import * as z from "zod";
import { DbInstance } from "../../src/db/instance";
import { DbConnection } from "../../src/db/connection";

describe("DbConnection", () => {
  let instance: DbInstance;
  let connection: DbConnection;

  beforeEach(async () => {
    instance = await DbInstance.create({ type: "in-memory" });
    const result = await instance.connect();

    if (result.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    connection = result.result;
  });

  afterEach(async () => {
    await instance.close();
  });

  describe("run", () => {
    test("runs SQL successfully", async () => {
      const result = await connection.run({
        sql: `CREATE TABLE test (id INTEGER)`,
      });
      expect(result.status).toBe("success");
    });

    test("returns error for invalid SQL", async () => {
      const result = await connection.run({ sql: `INVALID SQL` });
      expect(result.status).toBe("error");
    });
  });

  describe("query", () => {
    test("queries and returns rows", async () => {
      await connection.run({ sql: `CREATE TABLE test (name VARCHAR)` });
      await connection.run({ sql: `INSERT INTO test VALUES ('david')` });

      const result = await connection.query({
        sql: `SELECT name FROM test`,
        schema: z.object({ name: z.string() }),
      });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toEqual([{ name: "david" }]);
    });

    test("returns error for invalid query", async () => {
      const result = await connection.query({
        sql: `SELECT * FROM non_existent_table`,
        schema: z.object({ id: z.number() }),
      });
      expect(result.status).toBe("error");
    });

    test("returns error if row does not match schema", async () => {
      await connection.run({ sql: `CREATE TABLE test (id INTEGER)` });
      await connection.run({ sql: `INSERT INTO test VALUES (42)` });

      const result = await connection.query({
        sql: `SELECT id FROM test`,
        schema: z.object({ id: z.string() }),
      });

      expect(result.status).toBe("error");
    });

    test("runs SQL with values successfully", async () => {
      await connection.run({ sql: `CREATE TABLE test (name VARCHAR, age INTEGER)` });

      const result = await connection.run({
        sql: `INSERT INTO test VALUES ($name, $age)`,
        values: { name: "david", age: 42 },
      });

      expect(result.status).toBe("success");

      const rows = await connection.query({
        sql: `SELECT name, age FROM test`,
        schema: z.object({ name: z.string(), age: z.number() }),
      });

      expect(rows.status).toBe("success");

      if (rows.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(rows.result).toEqual([{ name: "david", age: 42 }]);
    });

    test("queries with values", async () => {
      await connection.run({ sql: `CREATE TABLE test (name VARCHAR, age INTEGER)` });
      await connection.run({ sql: `INSERT INTO test VALUES ('david', 42)` });
      await connection.run({ sql: `INSERT INTO test VALUES ('alice', 30)` });

      const result = await connection.query({
        sql: `SELECT name, age FROM test WHERE name = $name`,
        schema: z.object({ name: z.string(), age: z.number() }),
        values: { name: "david" },
      });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toEqual([{ name: "david", age: 42 }]);
    });
  });

  describe("queryOne", () => {
    test("returns single row", async () => {
      await connection.run({ sql: `CREATE TABLE test (name VARCHAR)` });
      await connection.run({ sql: `INSERT INTO test VALUES ('david')` });

      const result = await connection.queryOne({
        sql: `SELECT name FROM test WHERE name = $name`,
        schema: z.object({ name: z.string() }),
        values: { name: "david" },
      });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toEqual({ name: "david" });
    });

    test("returns undefined when no row found", async () => {
      await connection.run({ sql: `CREATE TABLE test (name VARCHAR)` });

      const result = await connection.queryOne({
        sql: `SELECT name FROM test WHERE name = $name`,
        schema: z.object({ name: z.string() }),
        values: { name: "david" },
      });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toBeUndefined();
    });

    test("returns error when multiple rows found", async () => {
      await connection.run({ sql: `CREATE TABLE test (name VARCHAR)` });
      await connection.run({ sql: `INSERT INTO test VALUES ('david')` });
      await connection.run({ sql: `INSERT INTO test VALUES ('alice')` });

      const result = await connection.queryOne({
        sql: `SELECT name FROM test`,
        schema: z.object({ name: z.string() }),
      });

      expect(result.status).toBe("error");
    });
  });

  describe("runAndReturnOne", () => {
    describe("runAndReturnOne", () => {
      test("returns the inserted row with RETURNING", async () => {
        await connection.run({ sql: `CREATE TABLE test (id INTEGER, name VARCHAR)` });

        const result = await connection.runAndReturnOne({
          sql: `INSERT INTO test VALUES (1, 'david') RETURNING id, name`,
          schema: z.object({ id: z.number(), name: z.string() }),
        });

        expect(result.status).toBe("success");

        if (result.status === "error") {
          expect(true).toBeFalsy();
          return;
        }

        expect(result.result).toEqual({ id: 1, name: "david" });
      });

      test("returns error when RETURNING produces no row", async () => {
        await connection.run({ sql: `CREATE TABLE test (id INTEGER, name VARCHAR)` });

        const result = await connection.runAndReturnOne({
          sql: `INSERT INTO test SELECT 1, 'david' WHERE false RETURNING id, name`,
          schema: z.object({ id: z.number(), name: z.string() }),
        });

        expect(result.status).toBe("error");
      });

      test("returns error for invalid SQL", async () => {
        const result = await connection.runAndReturnOne({
          sql: `INVALID SQL`,
          schema: z.object({ id: z.number() }),
        });

        expect(result.status).toBe("error");
      });
    });
  });
});
