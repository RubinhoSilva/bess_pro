#!/bin/sh
set -e

echo "🎨 Frontend Development Entrypoint"

# Create nodejs user if it doesn't exist
if ! id -u nodejs >/dev/null 2>&1; then
  echo "👤 Creating nodejs user..."
  addgroup -g 1001 -S nodejs
  adduser -S nodejs -u 1001 -G nodejs
fi

# Fix tsconfig.base.json symlink (shared expects it at /tsconfig.base.json)
if [ -f "/app/tsconfig.base.json" ] && [ ! -f "/tsconfig.base.json" ]; then
  echo "🔗 Creating symlink for tsconfig.base.json at root..."
  ln -sf /app/tsconfig.base.json /tsconfig.base.json
fi

# Build shared package
if [ -d "/app/shared" ]; then
  echo "📦 Building @bess-pro/shared package..."
  cd /app/shared

  if [ ! -d "dist" ]; then
    echo "   └─ dist/ not found, building from scratch..."
    npm run build:dev
  else
    echo "   └─ dist/ exists, rebuilding..."
    npm run build:dev
  fi

  echo "✅ @bess-pro/shared built successfully"
else
  echo "⚠️  Warning: /app/shared not found. Make sure volume is mounted."
fi

# Return to app directory
cd /app

# Check if node_modules is populated, install if needed
if [ ! -d "node_modules/rollup-plugin-visualizer" ]; then
  echo "📦 Installing frontend dependencies..."
  npm install
  echo "✅ Dependencies installed"
fi

# Fix permissions only for specific directories (not entire node_modules)
echo "🔧 Fixing permissions..."
if [ -d "/app/shared/dist" ]; then
  chown -R nodejs:nodejs /app/shared/dist
fi
if [ -d "/app/shared/node_modules" ]; then
  chown -R nodejs:nodejs /app/shared/node_modules
fi

# Create and fix permissions for Vite cache directory
echo "🔧 Preparing Vite cache directory..."
mkdir -p /app/node_modules/.vite
chown -R nodejs:nodejs /app/node_modules/.vite

echo "✅ Setup complete! Starting Vite dev server..."
echo ""

# Switch to nodejs user and execute CMD
exec su-exec nodejs "$@"
