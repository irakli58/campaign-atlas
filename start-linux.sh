#!/bin/sh
# Campaign Atlas: run this to start. It opens in your web browser; press Ctrl+C here to stop it.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Campaign Atlas needs Node.js 18 or newer (free): https://nodejs.org/"
  exit 1
fi
exec node server.js --open
