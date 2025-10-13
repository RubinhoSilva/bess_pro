#!/bin/sh
set -e

echo "🔧 Docker Development Entrypoint"

# Build shared package if not built
echo "📦 Building @bess-pro/shared package..."
cd /app/shared
if [ ! -d "dist" ]; then
  echo "   └─ dist/ not found, building from scratch..."
  npm run build:dev
else
  echo "   └─ dist/ exists, checking if rebuild needed..."
  npm run build:dev
fi

# Ensure symlink exists
echo "🔗 Creating symlink for @bess-pro/shared..."
cd /app/backend
rm -rf ./node_modules/@bess-pro/shared
mkdir -p ./node_modules/@bess-pro
ln -s /app/shared ./node_modules/@bess-pro/shared

echo "✅ Setup complete! Starting development server..."
echo ""

# Execute CMD from Dockerfile
exec "$@"
