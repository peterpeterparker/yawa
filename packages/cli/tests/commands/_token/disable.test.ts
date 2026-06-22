import { describe, expect, test, spyOn, afterEach } from "bun:test";
import * as logModule from "../../../src/utils/log";
import { tokenDisable } from "../../../src/commands/_token/disable";

describe("tokenDisable", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("disables a token successfully", async () => {
    const logSpy = spyOn(logModule, "log").mockImplementation(() => {});

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await tokenDisable(["--id", "01912d4e-1234-7000-8000-000000000000"]);

    expect(logSpy).toHaveBeenCalledWith("Token disabled (01912d4e-1234-7000-8000-000000000000)");

    logSpy.mockRestore();
  });

  test("exits when id is missing", async () => {
    await expect(tokenDisable([])).rejects.toThrow();
  });

  test("exits with error on failed response", async () => {
    const errorSpy = spyOn(logModule, "error").mockImplementation(() => {});
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
    );

    await expect(tokenDisable(["--id", "01912d4e-1234-7000-8000-000000000000"])).rejects.toThrow(
      "process.exit",
    );

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
