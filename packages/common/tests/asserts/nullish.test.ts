import { isNullish, nonNullish } from "../../src/asserts/nullish";
import { describe, expect, it } from "bun:test";

describe("nullish-utils", () => {
  describe("isNullish", () => {
    it("should determine nullable", () => {
      expect(isNullish(null)).toBeTruthy();
      expect(isNullish(undefined)).toBeTruthy();
      expect(isNullish(0)).toBeFalsy();
      expect(isNullish(1)).toBeFalsy();
      expect(isNullish("")).toBeFalsy();
      expect(isNullish([])).toBeFalsy();
    });
  });

  describe("nonNullish", () => {
    it("should determine not nullable", () => {
      expect(nonNullish(null)).toBeFalsy();
      expect(nonNullish(undefined)).toBeFalsy();
      expect(nonNullish(0)).toBeTruthy();
      expect(nonNullish(1)).toBeTruthy();
      expect(nonNullish("")).toBeTruthy();
      expect(nonNullish([])).toBeTruthy();
    });
  });
});
