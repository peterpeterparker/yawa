import { describe, expect, test, spyOn, afterEach } from "bun:test";
import * as logModule from "../../../src/utils/log.ts";
import { siteCreate } from "../../../src/commands/_site/create.ts";

describe("siteCreate", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("registers a site successfully", async () => {
    const logSpy = spyOn(logModule, "log").mockImplementation(() => {});

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "01912d4e-1234-7000-8000-000000000000" }), { status: 201 }),
    );

    await siteCreate(["--hostname", "example.com"]);

    expect(logSpy).toHaveBeenCalledWith(
      "Site registered: example.com (01912d4e-1234-7000-8000-000000000000)",
    );

    logSpy.mockRestore();
  });

  test("exits when hostname is missing", async () => {
    await expect(siteCreate([])).rejects.toThrow();
  });

  test("exits with error on failed response", async () => {
    const errorSpy = spyOn(logModule, "error").mockImplementation(() => {});
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Invalid hostname" }), { status: 400 }),
    );

    await expect(siteCreate(["--hostname", "invalid"])).rejects.toThrow("process.exit");

    expect(errorSpy).toHaveBeenCalledWith("Failed to create site:", "Invalid hostname");
    expect(exitSpy).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
