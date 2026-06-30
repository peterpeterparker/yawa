import { describe, expect, test, spyOn, afterEach } from "bun:test";
import { sitesList } from "../../../src/commands/_site/list";

describe("sitesList", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("lists sites successfully with linked hostnames", async () => {
    const tableSpy = spyOn(console, "table").mockImplementation(() => {});

    fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async (
      url: string | URL | Request,
    ) => {
      if (String(url).endsWith("/sites/linked")) {
        return new Response(
          JSON.stringify({
            linkedSites: [
              {
                id: "01912d4e-1234-7000-8000-000000000001",
                site_id: "01912d4e-1234-7000-8000-000000000000",
                hostname: "www.example.com",
                created_at: "2024-01-01 00:00:00.000000",
                updated_at: "2024-01-01 00:00:00.000000",
              },
            ],
          }),
          { status: 200 },
        );
      }

      return new Response(
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
      );
    }) as typeof fetch);

    await sitesList();

    expect(tableSpy).toHaveBeenCalledWith({
      "01912d4e-1234-7000-8000-000000000000": {
        hostname: "example.com",
        status: "active",
        linked_hostnames: "www.example.com",
      },
    });

    tableSpy.mockRestore();
  });

  test("exits with error when sites request fails", async () => {
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

  test("exits with error when linked sites request fails", async () => {
    const errorSpy = spyOn(console, "error").mockImplementation(() => {});
    const exitSpy = spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit");
    });

    fetchSpy = spyOn(globalThis, "fetch").mockImplementation((async (url) => {
      if (String(url).endsWith("/sites/linked")) {
        return new Response(JSON.stringify({ error: "Internal error" }), { status: 500 });
      }

      return new Response(
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
      );
    }) as typeof fetch);

    await expect(sitesList()).rejects.toThrow("process.exit");

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
