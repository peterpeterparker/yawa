import { describe, expect, test, spyOn, afterEach } from "bun:test";
import { sitesList } from "../../../src/commands/_site/list";

describe("sitesList", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("lists sites successfully", async () => {
    const tableSpy = spyOn(console, "table").mockImplementation(() => {});

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          sites: [
            {
              id: "01912d4e-1234-7000-8000-000000000000",
              hostname: "example.com",
              status: "active",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await sitesList();

    expect(tableSpy).toHaveBeenCalledWith({
      "01912d4e-1234-7000-8000-000000000000": { hostname: "example.com", status: "active" },
    });

    tableSpy.mockRestore();
  });

  test("exits with error on failed response", async () => {
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ error: "Internal error" }), { status: 500 }),
    );

    await expect(sitesList()).rejects.toThrow("process.exit");

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
