import { describe, expect, test } from "bun:test";
import { tryCatch, safeExec } from "../src/exec";

describe("exec", () => {
  describe("tryCatch", () => {
    test("returns success for resolved promise", async () => {
      const result = await tryCatch(async () => 42);
      expect(result).toEqual({ status: "success", result: 42 });
    });

    test("returns error for rejected promise", async () => {
      const err = new Error("oops");
      const result = await tryCatch(async () => {
        throw err;
      });
      expect(result).toEqual({ status: "error", err });
    });
  });

  describe("safeExec", () => {
    test("returns success result from fn", async () => {
      const result = await safeExec(async () => ({ status: "success" as const, result: 42 }));
      expect(result).toEqual({ status: "success", result: 42 });
    });

    test("returns error result from fn", async () => {
      const result = await safeExec(async () => ({ status: "error" as const, err: "oops" }));
      expect(result).toEqual({ status: "error", err: "oops" });
    });

    test("returns error if fn throws", async () => {
      const err = new Error("boom");
      const result = await safeExec(async () => {
        throw err;
      });
      expect(result).toEqual({ status: "error", err });
    });
  });
});
