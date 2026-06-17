import os from "node:os";

// Building duckdb with Bun does not work.
// see https://github.com/duckdb/duckdb-node-neo/issues/231

const platform = os.platform();
const arch = os.arch();

// https://github.com/duckdb/duckdb-node-neo#documentation
const duckdbPlatformBindings = [
  "@duckdb/node-bindings-darwin-arm64",
  "@duckdb/node-bindings-darwin-x64",
  "@duckdb/node-bindings-linux-arm64",
  "@duckdb/node-bindings-linux-arm64-musl",
  "@duckdb/node-bindings-linux-x64",
  "@duckdb/node-bindings-linux-x64-musl",
  "@duckdb/node-bindings-win32-arm64",
  "@duckdb/node-bindings-win32-x64",
];

// We need to set all bindings as external and Bun should not use the --compile option.
// Furthermore, the node_modules need to be copied in Docker.
const duckdbBindings = ["@duckdb/node-api", "@duckdb/node-bindings"];

// oven/bun is Debian-based so musl is not needed in Docker and I develop on Mac.
// If its support is needed in the future, e.g. detect-libc could be used to detect it.
const current = `@duckdb/node-bindings-${platform === "win32" ? "win32" : platform === "darwin" ? "darwin" : "linux"}-${arch === "x64" ? "x64" : "arm64"}`;

const platformSpecificExternals = duckdbPlatformBindings.filter((binding) => binding !== current);

await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./build",
  target: "bun",
  minify: true,
  external: [...duckdbBindings, ...platformSpecificExternals],
});
