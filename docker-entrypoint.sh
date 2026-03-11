#!/bin/sh
set -e

if [ ! -d ".next" ]; then
  echo "Building Next.js application..."
  npm run build
  cp -r .next/static .next/standalone/.next/static
fi

exec node .next/standalone/server.js
