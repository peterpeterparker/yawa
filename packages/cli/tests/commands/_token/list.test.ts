import { describe, expect, test, spyOn, afterEach } from "bun:test";
import { tokensList } from "../../../src/commands/_token/list";

describe("tokensList", () => {
  let fetchSpy: ReturnType<typeof spyOn>;

  afterEach(() => {
    fetchSpy?.mockRestore();
  });

  test("lists tokens successfully", async () => {
    const tableSpy = spyOn(console, "table").mockImplementation(() => {});

    fetchSpy = spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          tokens: [
            {
              id: "01912d4e-1234-7000-8000-000000000000",
              name: "mytoken",
              expires_at: null,
              created_at: "2026-01-01 00:00:00",
              updated_at: "2026-01-01 00:00:00",
            },
          ],
        }),
        { status: 200 },
      ),
    );

    await tokensList();

    expect(tableSpy).toHaveBeenCalledWith({
      "01912d4e-1234-7000-8000-000000000000": {
        name: "mytoken",
        expires_at: "never",
      },
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

    await expect(tokensList()).rejects.toThrow("process.exit");

    exitSpy.mockRestore();
    errorSpy.mockRestore();
  });
});
