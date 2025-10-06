# Multi-stage build for Backend
FROM node:20-alpine AS base

# Install dependencies for native modules and Chrome
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

# Development stage
FROM base AS development
ENV NODE_ENV=development

# Set working directory
WORKDIR /app

# Copy package files
COPY packages/shared/package*.json ./shared/
COPY apps/backend/package*.json ./backend/

# Copy base tsconfig to root and shared directory
COPY tsconfig.base.json ./
COPY tsconfig.base.json ./shared/

# Install shared dependencies first
WORKDIR /app/shared
RUN npm install

# Copy shared source
COPY packages/shared ./
# Build shared package
RUN npm run build

# Install backend dependencies
WORKDIR /app/backend
ENV PUPPETEER_SKIP_CHROME_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
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

# Copy and build shared package
COPY packages/shared/package*.json ./shared/
COPY tsconfig.base.json ./
COPY tsconfig.base.json ./shared/
WORKDIR /app/shared
RUN npm install
COPY packages/shared ./
RUN npm run build

# Install backend dependencies
WORKDIR /app/backend
COPY apps/backend/package*.json ./
ENV PUPPETEER_SKIP_CHROME_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
RUN npm install

# Copy backend source and build
COPY apps/backend ./
RUN npm run build:docker

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Install curl for health checks and Chrome
RUN apk add --no-cache \
    curl \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont

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
