import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { DbInstance } from "../../../src/db/instance";
import { migrate } from "../../../src/migrate";
import { DbAccessTokens } from "../../../src/queries/transactions/access-tokens";

describe("DbAccessTokens", () => {
  let instance: DbInstance;
  let queries: DbAccessTokens;

  beforeEach(async () => {
    instance = await DbInstance.create({ type: "in-memory" });
    await migrate({ instance });

    const connectionResult = await instance.connect();

    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    queries = DbAccessTokens.create({ connection: connectionResult.result });
  });

  afterEach(async () => {
    await instance.close();
  });

  describe("insert", () => {
    test("inserts a token successfully", async () => {
      const result = await queries.insert({
        name: "claude.ai",
        token_hash: "abc123",
        expires_at: null,
      });

      expect(result.status).toBe("success");
    });

    test("fails for duplicate name", async () => {
      await queries.insert({ name: "claude.ai", token_hash: "abc123", expires_at: null });
      const result = await queries.insert({
        name: "claude.ai",
        token_hash: "def456",
        expires_at: null,
      });

      expect(result.status).toBe("error");
    });

    test("fails for duplicate token_hash", async () => {
      await queries.insert({ name: "claude.ai", token_hash: "abc123", expires_at: null });
      const result = await queries.insert({
        name: "claude-code",
        token_hash: "abc123",
        expires_at: null,
      });

      expect(result.status).toBe("error");
    });

    test("inserts with expires_at", async () => {
      const result = await queries.insert({
        name: "claude.ai",
        token_hash: "abc123",
        expires_at: "2027-01-01",
      });

      expect(result.status).toBe("success");
    });
  });

  describe("findValidByHash", () => {
    test("findValidByHash returns token when found", async () => {
      await queries.insert({ name: "claude.ai", token_hash: "abc123", expires_at: null });

      const result = await queries.findValidByHash({ token_hash: "abc123" });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result?.name).toBe("claude.ai");
      expect(result.result?.token_hash).toBe("abc123");
    });

    test("findValidByHash returns undefined when not found", async () => {
      const result = await queries.findValidByHash({ token_hash: "nonexistent" });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toBeUndefined();
    });

    test("returns undefined for expired token", async () => {
      await queries.insert({ name: "expired", token_hash: "expired123", expires_at: "2020-01-01" });

      const result = await queries.findValidByHash({ token_hash: "expired123" });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toBeUndefined();
    });

    test("returns token for future expiry", async () => {
      await queries.insert({ name: "future", token_hash: "future123", expires_at: "9999-01-01" });

      const result = await queries.findValidByHash({ token_hash: "future123" });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result?.name).toBe("future");
    });
  });

  describe("findAll", () => {
    test("returns empty array when no tokens", async () => {
      const result = await queries.findAll();

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toHaveLength(0);
    });

    test("returns all tokens without token_hash", async () => {
      await queries.insert({ name: "claude.ai", token_hash: "abc123", expires_at: null });
      await queries.insert({ name: "claude-code", token_hash: "def456", expires_at: null });

      const result = await queries.findAll();

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toHaveLength(2);
      const names = result.result.map((t) => t.name);
      expect(names).toContain("claude.ai");
      expect(names).toContain("claude-code");
      expect(result.result[0]).not.toHaveProperty("token_hash");
    });

    test("returns id, name, expires_at, created_at and updated_at", async () => {
      await queries.insert({ name: "claude.ai", token_hash: "abc123", expires_at: null });

      const result = await queries.findAll();

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result[0]).toHaveProperty("id");
      expect(result.result[0]).toHaveProperty("name");
      expect(result.result[0]).toHaveProperty("expires_at");
      expect(result.result[0]).toHaveProperty("created_at");
      expect(result.result[0]).toHaveProperty("updated_at");
    });
  });

  describe("disable", () => {
    test("sets expires_at to now", async () => {
      const insertResult = await queries.insert({
        name: "claude.ai",
        token_hash: "abc123",
        expires_at: null,
      });

      expect(insertResult.status).toBe("success");

      const beforeFindResult = await queries.findAll();
      if (beforeFindResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const { id } = beforeFindResult.result[0]!;

      const disableResult = await queries.disable({ id });
      expect(disableResult.status).toBe("success");

      const findResult = await queries.findValidByHash({ token_hash: "abc123" });

      expect(findResult.status).toBe("success");
      if (findResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(findResult.result).toBeUndefined();
    });

    test("disabled token no longer matches findValidByHash", async () => {
      await queries.insert({ name: "claude.ai", token_hash: "abc123", expires_at: "9999-01-01" });

      const beforeFindResult = await queries.findAll();
      if (beforeFindResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const { id } = beforeFindResult.result[0]!;

      const beforeDisable = await queries.findValidByHash({ token_hash: "abc123" });
      if (beforeDisable.status === "error") {
        expect(true).toBeFalsy();
        return;
      }
      expect(beforeDisable.result).toBeDefined();

      await queries.disable({ id });

      const afterDisable = await queries.findValidByHash({ token_hash: "abc123" });
      if (afterDisable.status === "error") {
        expect(true).toBeFalsy();
        return;
      }
      expect(afterDisable.result).toBeUndefined();
    });

    test("succeeds silently for nonexistent id", async () => {
      const result = await queries.disable({ id: "01912d4e-1234-7000-8000-000000000000" });
      expect(result.status).toBe("success");
    });

    test("disabling an already disabled token is a no-op", async () => {
      const insertResult = await queries.insert({
        name: "claude.ai",
        token_hash: "abc123",
        expires_at: null,
      });
      expect(insertResult.status).toBe("success");

      const beforeFindResult = await queries.findAll();
      if (beforeFindResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const { id } = beforeFindResult.result[0]!;

      const firstDisable = await queries.disable({ id });
      expect(firstDisable.status).toBe("success");

      const afterFirstDisable = await queries.findAll();
      if (afterFirstDisable.status === "error") {
        expect(true).toBeFalsy();
        return;
      }
      const firstExpiresAt = afterFirstDisable.result[0]?.expires_at;

      await new Promise((resolve) => setTimeout(resolve, 10));

      const secondDisable = await queries.disable({ id });
      expect(secondDisable.status).toBe("success");

      const afterSecondDisable = await queries.findAll();
      if (afterSecondDisable.status === "error") {
        expect(true).toBeFalsy();
        return;
      }
      const secondExpiresAt = afterSecondDisable.result[0]?.expires_at;

      expect(secondExpiresAt).toBe(firstExpiresAt);
    });

    test("disabling an already expired token is a no-op", async () => {
      const insertResult = await queries.insert({
        name: "expired",
        token_hash: "expired123",
        expires_at: "2020-01-01",
      });
      expect(insertResult.status).toBe("success");

      const beforeFindResult = await queries.findAll();
      if (beforeFindResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const { id } = beforeFindResult.result[0]!;

      const disableResult = await queries.disable({ id });
      expect(disableResult.status).toBe("success");

      const afterDisable = await queries.findAll();
      if (afterDisable.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(afterDisable.result[0]?.expires_at).toBe("2020-01-01 00:00:00");
    });
  });
});
