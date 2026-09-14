#!/bin/bash
#
# Build command for Vercel while there are no TinaCloud credentials.
#
# Mirrors what scripts/preflight.sh does locally: `tinacms build --local` serves
# content/ over a GraphQL server and runs `next build` against it, so no client ID
# or token is needed.
#
# The explicit ports are the point. Tina defaults to 4001 and, when that port is
# already taken, it does not say so — it prints "server listening", the client then
# talks to whatever is squatting there, and the build hangs until the container runs
# out of memory or Vercel's build timeout kills it. Both of those happened here
# before these flags were added. preflight.sh picks free ports for the same reason.
#
# Delete this file and vercel.json once the TinaCloud env vars are set in Vercel;
# the normal `pnpm build` is the right command from then on.
#
set -euo pipefail

# Cap the heap so V8 collects instead of growing into a SIGKILL. Vercel's build
# container has 8 GB; leaving headroom for the Tina server and next build's workers.
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=6144"

exec npx tinacms build --local --skip-cloud-checks --noTelemetry \
  -p 34567 --datalayer-port 34568 \
  -c "next build"
