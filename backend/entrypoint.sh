#!/bin/sh
set -e

echo "🔍 Validating environment..."

if [ -z "$DATABASE_URL" ]; then
  echo "❌ ERROR: DATABASE_URL is not set. Please provide a PostgreSQL connection string."
  exit 1
fi

if [ -z "$JWT_SECRET" ]; then
  echo "❌ ERROR: JWT_SECRET is not set. Please provide a strong secret."
  exit 1
fi

if [ -z "$JWT_REFRESH_SECRET" ]; then
  echo "❌ ERROR: JWT_REFRESH_SECRET is not set. Please provide a strong secret."
  exit 1
fi

echo "🗄️  Running database migrations..."
npx prisma migrate deploy

echo "🚀 Starting server..."
exec node dist/index.js
