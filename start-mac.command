#!/bin/bash
# Campaign Atlas: double-click to start. It opens in your web browser; close this window to stop it.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo
  echo "  Campaign Atlas needs Node.js, which is free."
  echo "  Your browser will open its download page: install the version marked LTS,"
  echo "  then double-click this file again."
  echo
  open "https://nodejs.org/"
  read -r -p "Press Enter to close." _
  exit 1
fi
exec node server.js --open
