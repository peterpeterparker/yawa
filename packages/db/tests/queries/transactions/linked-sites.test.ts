import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { DbInstance } from "../../../src";
import { DbSites } from "../../../src/queries/transactions/sites";
import { DbLinkedSites } from "../../../src/queries/transactions/linked-sites";
import { migrate } from "../../../src/migrate";

describe("DbLinkedSites", () => {
  let instance: DbInstance;
  let queries: DbLinkedSites;
  let sites: DbSites;

  beforeEach(async () => {
    instance = await DbInstance.create({ type: "in-memory" });
    await migrate({ instance });

    const connectionResult = await instance.connect();

    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    queries = DbLinkedSites.create({ connection: connectionResult.result });
    sites = DbSites.create({ connection: connectionResult.result });
  });

  afterEach(async () => {
    await instance.close();
  });

  describe("insert", () => {
    test("inserts an additional hostname and returns its id", async () => {
      const siteResult = await sites.insert({ hostname: "example.com" });

      expect(siteResult.status).toBe("success");
      if (siteResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const result = await queries.insert({
        site_id: siteResult.result.id,
        hostname: "www.example.com",
      });

      expect(result.status).toBe("success");

      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result.id).toBeDefined();
    });

    test("fails for duplicate hostname", async () => {
      const siteResult = await sites.insert({ hostname: "example.com" });

      expect(siteResult.status).toBe("success");
      if (siteResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const { id: site_id } = siteResult.result;

      await queries.insert({ site_id, hostname: "www.example.com" });
      const result = await queries.insert({ site_id, hostname: "www.example.com" });

      expect(result.status).toBe("error");
    });

    test("fails for nonexistent site_id", async () => {
      const result = await queries.insert({
        site_id: "01912d4e-1234-7000-8000-000000000000",
        hostname: "www.example.com",
      });

      expect(result.status).toBe("error");
    });
  });

  describe("findAll", () => {
    test("returns empty array when no linked sites", async () => {
      const result = await queries.findAll();

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toHaveLength(0);
    });

    test("returns all linked sites ordered by hostname", async () => {
      const siteResult = await sites.insert({ hostname: "example.com" });

      expect(siteResult.status).toBe("success");
      if (siteResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const { id: site_id } = siteResult.result;

      await queries.insert({ site_id, hostname: "www.example.com" });
      await queries.insert({ site_id, hostname: "blog.example.com" });

      const result = await queries.findAll();

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result).toHaveLength(2);
      expect(result.result[0]?.hostname).toBe("blog.example.com");
      expect(result.result[1]?.hostname).toBe("www.example.com");
    });

    test("returns site_id and hostname for each row", async () => {
      const siteResult = await sites.insert({ hostname: "example.com" });

      expect(siteResult.status).toBe("success");
      if (siteResult.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      const { id: site_id } = siteResult.result;

      await queries.insert({ site_id, hostname: "www.example.com" });

      const result = await queries.findAll();

      expect(result.status).toBe("success");
      if (result.status === "error") {
        expect(true).toBeFalsy();
        return;
      }

      expect(result.result[0]?.site_id).toBe(site_id);
      expect(result.result[0]?.hostname).toBe("www.example.com");
      expect(result.result[0]).toHaveProperty("id");
    });
  });
});
