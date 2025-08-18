#!/bin/bash

echo "🚀 Iniciando BESS Pro Development Environment..."

# Build shared package first
echo "📦 Building shared package..."
cd packages/shared && npm install && npm run build && cd ../..

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d mongodb redis

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Start development servers
echo "🔧 Starting development servers..."
npm run dev

echo "✅ Development environment ready!"
echo "🌐 Frontend: http://localhost:3003"
echo "🔧 Backend: http://localhost:8010"  # 👈 MUDANÇA
echo "🗄️ MongoDB: localhost:27017 (admin/bess123456)"
echo "📦 Redis: localhost:6380 (password: redis123456)"
echo "🗄️ MongoDB Admin: http://localhost:8081 (admin/admin123)"
