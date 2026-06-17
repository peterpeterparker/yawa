import { describe, expect, test } from "bun:test";
import {
  sanitizeEmptyString,
  assertNotEmptyString,
  isEmptyString,
  notEmptyString,
} from "../../src/asserts/strings";

describe("strings", () => {
  describe("sanitizeEmptyString", () => {
    test("returns string for valid input", () => {
      expect(sanitizeEmptyString("hello")).toBe("hello");
    });

    test("trims whitespace", () => {
      expect(sanitizeEmptyString("  hello  ")).toBe("hello");
    });

    test("returns undefined for empty string", () => {
      expect(sanitizeEmptyString("")).toBeUndefined();
    });

    test("returns undefined for whitespace only", () => {
      expect(sanitizeEmptyString("   ")).toBeUndefined();
    });

    test("returns undefined for null", () => {
      expect(sanitizeEmptyString(null)).toBeUndefined();
    });

    test("returns undefined for undefined", () => {
      expect(sanitizeEmptyString(undefined)).toBeUndefined();
    });
  });

  describe("assertNotEmptyString", () => {
    test("does not throw for valid string", () => {
      expect(() => assertNotEmptyString("hello", "field")).not.toThrow();
    });

    test("throws for empty string", () => {
      expect(() => assertNotEmptyString("", "field")).toThrow(
        "Missing or empty required field field",
      );
    });

    test("throws for whitespace only", () => {
      expect(() => assertNotEmptyString("   ", "field")).toThrow(
        "Missing or empty required field field",
      );
    });

    test("throws for null", () => {
      expect(() => assertNotEmptyString(null, "field")).toThrow(
        "Missing or empty required field field",
      );
    });

    test("throws for undefined", () => {
      expect(() => assertNotEmptyString(undefined, "field")).toThrow(
        "Missing or empty required field field",
      );
    });
  });

  describe("notEmptyString", () => {
    test("should determine not empty", () => {
      expect(notEmptyString(null)).toBeFalsy();
      expect(notEmptyString(undefined)).toBeFalsy();
      expect(notEmptyString("")).toBeFalsy();
      expect(notEmptyString("test")).toBeTruthy();
    });
  });

  describe("isEmptyString", () => {
    test("should determine empty", () => {
      expect(isEmptyString(null)).toBeTruthy();
      expect(isEmptyString(undefined)).toBeTruthy();
      expect(isEmptyString("")).toBeTruthy();
      expect(isEmptyString("test")).toBeFalsy();
    });
  });
});
