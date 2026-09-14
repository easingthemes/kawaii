#!/bin/bash
#
# Build command for Vercel while there are no TinaCloud credentials.
#
# Mirrors what scripts/preflight.sh does locally: `tinacms build --local` serves
# content/ over a GraphQL server and runs `next build` against it, so no client ID
# or token is needed.
#
# The explicit ports match what preflight.sh does. They did not turn out to be the
# cause of the build hangs here — the log showed Tina taking port 34567 cleanly and
# dying anyway — but a port collision is a documented failure mode in this stack and
# it presents as a silent hang, so pinning them keeps that possibility off the table.
#
# Delete this file and vercel.json once the TinaCloud env vars are set in Vercel;
# the normal `pnpm build` is the right command from then on.
#
set -euo pipefail

# Keep V8 well under the container. This build passes locally on a 15 GB machine
# and was SIGKILLed on Vercel, whose Hobby build container has 8 GB — the Tina
# content server and next build's compile workers together want more than that when
# nothing tells them to collect. An earlier attempt set 6144, which only granted V8
# a bigger budget before its first serious GC and made the kill arrive sooner; the
# cap has to be low, not high.
export NODE_OPTIONS="${NODE_OPTIONS:-} --max-old-space-size=3072"

exec npx tinacms build --local --skip-cloud-checks --noTelemetry \
  -p 34567 --datalayer-port 34568 \
  -c "next build" 
