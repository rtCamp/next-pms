#!/bin/sh
# Build the frappe-ui-react submodule only when its checkout changed since the last build.
# The app consumes it through a file: symlink, so a fresh dist is visible without reinstall.
set -e
cd "$(dirname "$0")/../../frappe-ui-react"
marker=packages/frappe-ui-react/dist/.built-sha
sha="$(git rev-parse HEAD 2>/dev/null || echo unknown)"
if [ -n "$(git status --porcelain --untracked-files=no 2>/dev/null)" ]; then
  sha="$sha+dirty"
fi
if [ "$sha" != "unknown" ] && [ "$(cat "$marker" 2>/dev/null)" = "$sha" ]; then
  echo "frappe-ui-react unchanged ($sha), skipping its build"
  exit 0
fi
(cd ../frontend && npm run corepack-enable)
pnpm install --frozen-lockfile
pnpm build
echo "$sha" > "$marker"
