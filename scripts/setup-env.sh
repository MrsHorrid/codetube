#!/bin/bash
# Setup script: generates a .env file for docker-compose from .env.production.example
# Usage: bash scripts/setup-env.sh

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(dirname "$SCRIPT_DIR")"
ENV_EXAMPLE="$ROOT_DIR/.env.production.example"
ENV_FILE="$ROOT_DIR/.env"

if [ -f "$ENV_FILE" ]; then
  echo "⚠️  .env already exists. Skipping (delete it manually to regenerate)."
  exit 0
fi

echo "📋 Copying .env.production.example → .env"
cp "$ENV_EXAMPLE" "$ENV_FILE"

# Generate strong JWT secrets
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
POSTGRES_PASSWORD=$(openssl rand -base64 16 | tr -d '/+=' | head -c 20)

# Replace placeholder values
sed -i "s|change_this_to_a_random_string_min_32_chars|$JWT_SECRET|g" "$ENV_FILE"
sed -i "s|change_this_to_a_different_random_string|$JWT_REFRESH_SECRET|g" "$ENV_FILE"
sed -i "s|change_me_in_production|$POSTGRES_PASSWORD|g" "$ENV_FILE"

# Set DATABASE_URL using the generated password
sed -i "s|DATABASE_URL=postgresql://codetube:.*@postgres|DATABASE_URL=postgresql://codetube:$POSTGRES_PASSWORD@postgres|g" "$ENV_FILE"

echo "✅ .env created with auto-generated secrets."
echo ""
echo "⚠️  IMPORTANT: Review .env and update these before deploying:"
echo "   - CORS_ORIGIN (set to your frontend domain)"
echo "   - AI_PROVIDER / AI_API_KEY (if using AI features)"
echo "   - FISH_AUDIO_API_KEY (if using voice synthesis)"
echo ""
echo "Run: docker-compose up -d"
