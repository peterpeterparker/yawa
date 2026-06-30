import { describe, expect, test, spyOn, afterEach } from "bun:test";
import * as logModule from "../../../src/utils/log";
import { siteLink } from "../../../src/commands/_site/link";

describe("siteLink", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("links a hostname successfully", async () => {
    const logSpy = spyOn(logModule, "log").mockImplementation(() => {});

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "01912d4e-1234-7000-8000-000000000001" }), {
        status: 201,
      }),
    );

    await siteLink([
      "--id",
      "01912d4e-1234-7000-8000-000000000000",
      "--hostname",
      "www.example.com",
    ]);

    expect(logSpy).toHaveBeenCalledWith(
      "Hostname linked: www.example.com (01912d4e-1234-7000-8000-000000000001) -> site 01912d4e-1234-7000-8000-000000000000",
    );

    logSpy.mockRestore();
  });

  test("exits when id is missing", async () => {
    await expect(siteLink(["--hostname", "www.example.com"])).rejects.toThrow();
  });

  test("exits when hostname is missing", async () => {
    await expect(siteLink(["--id", "01912d4e-1234-7000-8000-000000000000"])).rejects.toThrow();
  });

  test("exits with error on failed response", async () => {
    const errorSpy = spyOn(logModule, "error").mockImplementation(() => {});
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Hostname already in use" }), { status: 400 }),
    );

    await expect(
      siteLink(["--id", "01912d4e-1234-7000-8000-000000000000", "--hostname", "www.example.com"]),
    ).rejects.toThrow("process.exit");

    expect(errorSpy).toHaveBeenCalledWith("Failed to link hostname:", "Hostname already in use");
    expect(exitSpy).toHaveBeenCalledWith(1);

    errorSpy.mockRestore();
    exitSpy.mockRestore();
  });
});
