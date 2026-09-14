#!/bin/bash
#
# Regenerates tina/tina-lock.json from the local build output.
#
# TinaCloud reads that file out of the repo to learn the content schema, so when it
# is stale the indexed schema and the queries the site sends disagree and every
# request comes back 400. It arrived here stale: the file was copied from the
# tatjanizza repo and still described that site's blocks (tzHero, tzTracks) long
# after this repo's had been replaced (kwHero, kwGallery, kwEvents).
#
# It is normally written by `tinacms build` against TinaCloud, which needs a
# TINA_TOKEN. `tinacms build --local` does not write it at all — which is why
# scripts/preflight.sh passing told us nothing about this. But the file is only the
# three artifacts the local build already produces, so it can be rebuilt offline:
#
#   tina-lock.json = { schema: _schema.json, lookup: _lookup.json, graphql: _graphql.json }
#
# Run this after any schema change, commit the result, and then trigger a reindex in
# the TinaCloud dashboard.
#
set -euo pipefail
cd "$(dirname "$0")/.."

GEN=tina/__generated__
if [ ! -f "$GEN/_schema.json" ]; then
  echo "No build output in $GEN — run ./scripts/preflight.sh first." >&2
  exit 1
fi

python3 - <<'PY'
import json

gen = 'tina/__generated__'
lock = {
    'schema': json.load(open(f'{gen}/_schema.json')),
    'lookup': json.load(open(f'{gen}/_lookup.json')),
    'graphql': json.load(open(f'{gen}/_graphql.json')),
}
with open('tina/tina-lock.json', 'w') as f:
    json.dump(lock, f)

blocks = [
    t['name']
    for c in lock['schema']['collections'] if c['name'] == 'page'
    for f_ in c['fields'] if f_['name'] == 'blocks'
    for t in f_['templates']
]
print('tina/tina-lock.json written. page blocks:', ', '.join(blocks))
PY
