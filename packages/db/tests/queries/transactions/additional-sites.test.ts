import { beforeEach, afterEach, describe, expect, test } from "bun:test";
import { DbInstance } from "../../../src";
import { DbSites } from "../../../src/queries/transactions/sites";
import { DbAdditionalSites } from "../../../src/queries/transactions/additional-sites";
import { migrate } from "../../../src/migrate";

describe("DbAdditionalSites", () => {
  let instance: DbInstance;
  let queries: DbAdditionalSites;
  let sites: DbSites;

  beforeEach(async () => {
    instance = await DbInstance.create({ type: "in-memory" });
    await migrate({ instance });

    const connectionResult = await instance.connect();

    if (connectionResult.status === "error") {
      expect(true).toBeFalsy();
      return;
    }

    queries = DbAdditionalSites.create({ connection: connectionResult.result });
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
});
