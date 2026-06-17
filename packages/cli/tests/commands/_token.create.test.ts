import { describe, expect, test, spyOn, afterEach } from "bun:test";
import * as logModule from "../../src/utils/log";
import { tokenCreate } from "../../src/commands/_token.create";

describe("tokenCreate", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("creates a token successfully", async () => {
    const logSpy = spyOn(logModule, "log").mockImplementation(() => {});

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ token: "abc123token" }), { status: 200 }),
    );

    await tokenCreate(["--name", "claude.ai"]);

    expect(logSpy).toHaveBeenCalledWith(`Access token created for "claude.ai":`);
    expect(logSpy).toHaveBeenCalledWith(`\n  abc123token\n`);
    expect(logSpy).toHaveBeenCalledWith(`⚠️  Save this token as it won't be shown again.`);

    logSpy.mockRestore();
  });

  test("exits when name is missing", async () => {
    await expect(tokenCreate([])).rejects.toThrow();
  });

  test("exits with error on failed response", async () => {
    const errorSpy = spyOn(logModule, "error").mockImplementation(() => {});
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid name" }), { status: 400 }),
    );

    await expect(tokenCreate(["--name", "invalid"])).rejects.toThrow("process.exit");

    expect(errorSpy).toHaveBeenCalledWith("Failed to create token:", "Invalid name");
    expect(exitSpy).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
