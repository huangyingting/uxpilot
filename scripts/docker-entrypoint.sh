#!/usr/bin/env sh
set -e

echo "[UX Pilot Studio] Synchronizing PostgreSQL schema..."
npx prisma db push --schema=prisma/schema.postgres.prisma --accept-data-loss

if [ -n "$BOOTSTRAP_ADMIN_EMAIL" ] && [ -n "$BOOTSTRAP_ADMIN_PASSWORD" ]; then
  echo "[UX Pilot Studio] Provisioning CLI bootstrap administrator ($BOOTSTRAP_ADMIN_EMAIL)..."
  npm run bootstrap:admin || true
fi

echo "[UX Pilot Studio] Starting Next.js production server..."
exec npm run start
