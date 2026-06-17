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
});
