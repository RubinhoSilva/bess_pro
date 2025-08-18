# Multi-stage build for Backend
FROM node:20-alpine AS base

# Install dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Set working directory
WORKDIR /app

# Copy base tsconfig first (IMPORTANTE!)
COPY tsconfig.base.json ./

# Copy package files
COPY packages/shared/package*.json ./shared/
COPY apps/backend/package*.json ./backend/

# Install shared dependencies first
WORKDIR /app/shared
RUN npm install

# Copy shared source AND tsconfig
COPY packages/shared ./
# Build shared package
RUN npm run build

# Install backend dependencies
WORKDIR /app/backend
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install

# Copy backend source
COPY apps/backend ./

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/health || exit 1

# Start development server
CMD ["npm", "run", "dev:docker"]

# Production build stage
FROM base AS build
ENV NODE_ENV=production

WORKDIR /app

# Copy base tsconfig
COPY tsconfig.base.json ./

# Copy and build shared package
COPY packages/shared/package*.json ./shared/
WORKDIR /app/shared
RUN npm install
COPY packages/shared ./
RUN npm run build

# Install backend dependencies
WORKDIR /app/backend
COPY apps/backend/package*.json ./
ENV PUPPETEER_SKIP_DOWNLOAD=true
RUN npm install

# Copy backend source and build
COPY apps/backend ./
RUN npm run build:docker

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install curl for health checks
RUN apk add --no-cache curl

# Copy built application
COPY --from=build /app/backend/dist ./dist
COPY --from=build /app/backend/node_modules ./node_modules
COPY --from=build /app/shared ./shared
COPY --from=build /app/backend/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
  CMD curl -f http://localhost:5000/api/v1/health || exit 1

# Start production server
CMD ["npm", "start"]
