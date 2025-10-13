# Multi-stage build for Backend
FROM node:20-alpine AS base

# Install only runtime dependencies (curl for healthcheck)
RUN apk add --no-cache curl

# Build dependencies stage (for native modules compilation)
FROM base AS builder-deps
RUN apk add --no-cache python3 make g++

# Development stage
FROM builder-deps AS development
ENV NODE_ENV=development

# Set working directory
WORKDIR /app

# Copy ONLY package files (not source code - comes from volumes)
COPY packages/shared/package*.json ./shared/
COPY apps/backend/package*.json ./backend/
COPY tsconfig.base.json ./
COPY tsconfig.base.json /tsconfig.base.json

# Install shared dependencies
WORKDIR /app/shared
RUN npm install

# Install backend dependencies (ALL deps for dev)
WORKDIR /app/backend
RUN npm install

# Copy entrypoint script
COPY apps/backend/docker-entrypoint-dev.sh /docker-entrypoint-dev.sh
RUN chmod +x /docker-entrypoint-dev.sh

# Expose port (align with AppConfig.ts and docker-compose)
EXPOSE 8010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8010/api/v1/health || exit 1

# Entrypoint will build shared and create symlink
ENTRYPOINT ["/docker-entrypoint-dev.sh"]

# Start development server (ts-node resolves TS imports on-the-fly)
CMD ["npm", "run", "dev:docker"]

# Production build stage
FROM builder-deps AS build
ENV NODE_ENV=production

WORKDIR /app

# Copy package files first
COPY packages/shared/package*.json ./shared/
COPY tsconfig.base.json ./
COPY tsconfig.base.json /tsconfig.base.json
COPY tsconfig.base.json ./shared/

# Install and build shared package
WORKDIR /app/shared
RUN npm ci
COPY packages/shared ./
RUN npm run build

# Install backend dependencies (ALL, including devDependencies for build)
WORKDIR /app/backend
COPY apps/backend/package*.json ./
RUN npm ci

# Copy backend source and build
COPY apps/backend ./

# Fix shared package symlink
RUN rm -rf ./node_modules/@bess-pro/shared && \
    mkdir -p ./node_modules/@bess-pro && \
    ln -s /app/shared ./node_modules/@bess-pro/shared

# Build application
RUN npm run build:docker

# Remove devDependencies after build
RUN npm prune --production

# Production stage (minimal runtime dependencies only)
FROM base AS production
WORKDIR /app

# Copy built application from build stage
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/backend/package*.json ./

# Fix shared package symlink
RUN rm -rf ./node_modules/@bess-pro/shared && \
    mkdir -p ./node_modules/@bess-pro && \
    ln -s ./shared ./node_modules/@bess-pro/shared

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port (align with AppConfig.ts)
EXPOSE 8010

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:8010/api/v1/health || exit 1

# Start production server
CMD ["npm", "start"]
