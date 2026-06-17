import { describe, expect, test } from "bun:test";
import { getIp } from "../../../src/app/utils/ip";

const makeHeaders = (headers: Record<string, string>): Headers => new Headers(headers);

describe("getIp", () => {
  describe("x-forwarded-for", () => {
    test("returns first IP from x-forwarded-for", () => {
      const result = getIp({ headers: makeHeaders({ "x-forwarded-for": "192.0.2.1, 10.0.0.1" }) });
      expect(result).toBe("192.0.2.1");
    });

    test("handles single IP in x-forwarded-for", () => {
      const result = getIp({ headers: makeHeaders({ "x-forwarded-for": "192.0.2.1" }) });
      expect(result).toBe("192.0.2.1");
    });

    test("strips IPv4-mapped IPv6 from x-forwarded-for", () => {
      const result = getIp({ headers: makeHeaders({ "x-forwarded-for": "::ffff:192.0.2.1" }) });
      expect(result).toBe("192.0.2.1");
    });
  });

  describe("forwarded", () => {
    test("extracts IP from forwarded header", () => {
      const result = getIp({ headers: makeHeaders({ forwarded: "for=192.0.2.1" }) });
      expect(result).toBe("192.0.2.1");
    });

    test("extracts IPv6 from forwarded header", () => {
      const result = getIp({ headers: makeHeaders({ forwarded: "for=[2001:db8::1]" }) });
      expect(result).toBe("2001:db8::1");
    });

    test("returns undefined for invalid forwarded header", () => {
      const result = getIp({ headers: makeHeaders({ forwarded: "proto=https" }) });
      expect(result).toBeUndefined();
    });
  });

  describe("x-real-ip", () => {
    test("returns IP from x-real-ip", () => {
      const result = getIp({ headers: makeHeaders({ "x-real-ip": "192.0.2.1" }) });
      expect(result).toBe("192.0.2.1");
    });
  });

  describe("normalizeIp", () => {
    test("normalizes IPv4-mapped IPv6", () => {
      const result = getIp({ headers: makeHeaders({ "x-real-ip": "::ffff:192.0.2.1" }) });
      expect(result).toBe("192.0.2.1");
    });

    test("returns valid IPv6 as-is", () => {
      const result = getIp({ headers: makeHeaders({ "x-real-ip": "2001:db8::1" }) });
      expect(result).toBe("2001:db8::1");
    });

    test("strips port from IPv4", () => {
      const result = getIp({ headers: makeHeaders({ "x-real-ip": "192.0.2.1:8080" }) });
      expect(result).toBe("192.0.2.1");
    });

    test("returns undefined for invalid IP", () => {
      const result = getIp({ headers: makeHeaders({ "x-real-ip": "not-an-ip" }) });
      expect(result).toBeUndefined();
    });
  });

  describe("header priority", () => {
    test("prefers true-client-ip over x-forwarded-for", () => {
      const result = getIp({
        headers: makeHeaders({
          "true-client-ip": "192.0.2.1",
          "x-forwarded-for": "10.0.0.1",
        }),
      });
      expect(result).toBe("192.0.2.1");
    });
  });

  describe("missing headers", () => {
    test("returns undefined when no IP headers present", () => {
      const result = getIp({ headers: makeHeaders({}) });
      expect(result).toBeUndefined();
    });

    test("returns undefined when header value is empty", () => {
      const result = getIp({ headers: makeHeaders({ "x-real-ip": "" }) });
      expect(result).toBeUndefined();
    });
  });
});
