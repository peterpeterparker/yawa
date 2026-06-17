import { describe, expect, test, spyOn } from "bun:test";
import { exitWithResponse } from "../../src/utils/exit";
import * as logModule from "../../src/utils/log";

describe("exit", () => {
  describe("exitWithResponse", () => {
    test("logs structured error and exits", async () => {
      const errorSpy = spyOn(logModule, "error").mockImplementation(() => {});
      const exitSpy = spyOn(process, "exit").mockImplementation(() => undefined as never);

      const response = new Response(JSON.stringify({ error: "Something failed" }), { status: 500 });

      await exitWithResponse({ response, msg: "Failed to create token" });

      expect(errorSpy).toHaveBeenCalledWith("Failed to create token:", "Something failed");
      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });

    test("logs raw text and exits when response is not JSON", async () => {
      const errorSpy = spyOn(logModule, "error").mockImplementation(() => {});
      const exitSpy = spyOn(process, "exit").mockImplementation(() => undefined as never);

      const response = new Response("Internal Server Error", { status: 500 });

      await exitWithResponse({ response, msg: "Failed to create site" });

      expect(errorSpy).toHaveBeenCalledWith("Failed to create site:", "Internal Server Error");
      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });

    test("logs raw text when JSON does not match ErrorSchema", async () => {
      const errorSpy = spyOn(logModule, "error").mockImplementation(() => {});
      const exitSpy = spyOn(process, "exit").mockImplementation(() => undefined as never);

      const body = JSON.stringify({ unexpected: "shape" });
      const response = new Response(body, { status: 500 });

      await exitWithResponse({ response, msg: "Failed" });

      expect(errorSpy).toHaveBeenCalledWith("Failed:", body);
      expect(exitSpy).toHaveBeenCalledWith(1);

      errorSpy.mockRestore();
      exitSpy.mockRestore();
    });
  });
});
