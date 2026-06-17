import { beforeEach } from "bun:test";

beforeEach(() => {
  process.env.YAWA_SESSION_SECRET = "test-secret";
});
