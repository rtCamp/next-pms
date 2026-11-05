#!/bin/sh
# Run `npm install` only when node_modules is missing or older than the lockfile.
set -e
cd "$(dirname "$0")/.."
if [ ! -d node_modules ] || [ package-lock.json -nt node_modules/.package-lock.json ]; then
  npm install
else
  echo "node_modules is up to date, skipping npm install"
fi
