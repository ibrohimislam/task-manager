#!/bin/sh
set -e

if [ ! -d ".next" ]; then
  echo "Building Next.js application..."
  npm run build
fi

exec node .next/standalone/server.js
