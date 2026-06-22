import { describe, expect, test, spyOn, afterEach } from "bun:test";
import * as logModule from "../../../src/utils/log";
import { siteUpdate } from "../../../src/commands/_site/update";

describe("siteUpdate", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("updates a site status successfully", async () => {
    const logSpy = spyOn(logModule, "log").mockImplementation(() => {});

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(new Response(null, { status: 204 }));

    await siteUpdate(["--id", "01912d4e-1234-7000-8000-000000000000", "--status", "disabled"]);

    expect(logSpy).toHaveBeenCalledWith("Site updated (01912d4e-1234-7000-8000-000000000000)");

    logSpy.mockRestore();
  });

  test("exits when id is missing", async () => {
    await expect(siteUpdate(["--status", "disabled"])).rejects.toThrow();
  });

  test("exits when status is missing", async () => {
    await expect(siteUpdate(["--id", "01912d4e-1234-7000-8000-000000000000"])).rejects.toThrow();
  });

  test("exits when status is invalid", async () => {
    await expect(
      siteUpdate(["--id", "01912d4e-1234-7000-8000-000000000000", "--status", "invalid"]),
    ).rejects.toThrow();
  });

  test("exits with error on failed response", async () => {
    const errorSpy = spyOn(logModule, "error").mockImplementation(() => {});
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Not found" }), { status: 404 }),
    );

    await expect(
      siteUpdate(["--id", "01912d4e-1234-7000-8000-000000000000", "--status", "disabled"]),
    ).rejects.toThrow("process.exit");

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
