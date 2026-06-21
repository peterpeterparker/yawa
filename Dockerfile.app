FROM oven/bun:1 AS base
WORKDIR /usr/src/app

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install

RUN mkdir -p /temp/dev
COPY package.json bun.lock /temp/dev/
COPY packages/app/package.json /temp/dev/packages/app/
COPY packages/common/package.json /temp/dev/packages/common/
COPY packages/db/package.json /temp/dev/packages/db/
COPY packages/schema/package.json /temp/dev/packages/schema/
COPY packages/cli/package.json /temp/dev/packages/cli/
COPY packages/tracker/package.json /temp/dev/packages/tracker/
COPY packages/docs/package.json /temp/dev/packages/docs/
RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
RUN mkdir -p /temp/prod
COPY package.json bun.lock /temp/prod/
COPY packages/app/package.json /temp/prod/packages/app/
COPY packages/common/package.json /temp/prod/packages/common/
COPY packages/db/package.json /temp/prod/packages/db/
COPY packages/schema/package.json /temp/prod/packages/schema/
COPY packages/cli/package.json /temp/prod/packages/cli/
COPY packages/tracker/package.json /temp/prod/packages/tracker/
COPY packages/docs/package.json /temp/prod/packages/docs/
RUN cd /temp/prod && bun install --frozen-lockfile --production

# copy node_modules from temp directory
# then copy all (non-ignored) project files into the image
FROM base AS prerelease
COPY --from=install /temp/dev/node_modules node_modules
COPY --from=install /temp/dev/packages/app/node_modules ./packages/app/node_modules
COPY --from=install /temp/dev/packages/common/node_modules ./packages/common/node_modules
COPY --from=install /temp/dev/packages/db/node_modules ./packages/db/node_modules
COPY --from=install /temp/dev/packages/schema/node_modules ./packages/schema/node_modules
COPY --from=install /temp/dev/packages/cli/node_modules ./packages/cli/node_modules

COPY .oxfmtrc.json .oxfmtrc.json
COPY .oxlintrc.json .oxlintrc.json
COPY package.json package.json
COPY tsconfig.json tsconfig.json
COPY bunfig.toml bunfig.toml
COPY test-setup.ts test-setup.ts

COPY packages/app ./packages/app
COPY packages/common ./packages/common
COPY packages/db ./packages/db
COPY packages/schema ./packages/schema
COPY packages/cli ./packages/cli

# tests & build
RUN bun test

ENV NODE_ENV=production
RUN bun run --filter yawa-app build
RUN bun run --filter yawa-cli build

# build final image
FROM base AS release

# We need to copy native bindings (e.g. DuckDB) from prod node_modules
# otherwise we cannot start the db.
# error: libduckdb.so: cannot open shared object file: No such file or directory
COPY --from=install /temp/prod/node_modules ./node_modules

# Copy runtimes
COPY --from=prerelease /usr/src/app/packages/app/build/index.js ./index.js
COPY --from=prerelease /usr/src/app/packages/cli/build/cli ./cli

# Copy resources
COPY --from=prerelease /usr/src/app/packages/db/bootstrap ./bootstrap
COPY --from=prerelease /usr/src/app/packages/db/migrations ./migrations

COPY LICENSE README.md /

# Grant privileges to the runner user to write in data
RUN mkdir -p /data && chown -R bun:bun /data

USER bun

EXPOSE 3000

CMD ["bun", "index.js"]