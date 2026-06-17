import { describe, expect, test } from "bun:test";
import { hasArgs, nextArg } from "../../src/utils/args";

describe("args", () => {
  describe("hasArgs", () => {
    test("returns true when one of the options is present", () => {
      expect(hasArgs({ args: ["--help"], options: ["--help", "-h"] })).toBe(true);
    });

    test("returns true when a different option matches", () => {
      expect(hasArgs({ args: ["-h"], options: ["--help", "-h"] })).toBe(true);
    });

    test("returns false when no options are present", () => {
      expect(hasArgs({ args: ["--name", "test"], options: ["--help", "-h"] })).toBe(false);
    });

    test("returns false when args is undefined", () => {
      expect(hasArgs({ args: undefined, options: ["--help"] })).toBe(false);
    });

    test("returns false when args is empty", () => {
      expect(hasArgs({ args: [], options: ["--help"] })).toBe(false);
    });
  });

  describe("nextArg", () => {
    test("returns the value following the option", () => {
      expect(nextArg({ args: ["--name", "claude.ai"], option: "--name" })).toBe("claude.ai");
    });

    test("returns undefined when option is not present", () => {
      expect(nextArg({ args: ["--name", "claude.ai"], option: "--expires" })).toBeUndefined();
    });

    test("returns undefined when args is undefined", () => {
      expect(nextArg({ args: undefined, option: "--name" })).toBeUndefined();
    });

    test("returns undefined when option is the last argument with no value", () => {
      expect(nextArg({ args: ["--name"], option: "--name" })).toBeUndefined();
    });

    test("returns the next value even if it looks like another option", () => {
      expect(nextArg({ args: ["--name", "--expires"], option: "--name" })).toBe("--expires");
    });
  });
});
