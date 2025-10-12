# Dockerfile para desenvolvimento
FROM node:20-alpine

# Install su-exec for user switching in entrypoint
RUN apk add --no-cache su-exec

# Set working directory (aligns with volume mount)
WORKDIR /app

# Copy ONLY package files (code comes from volumes)
COPY apps/frontend/package*.json ./

# Install dependencies (as root, no chown needed)
RUN npm ci

# Copy entrypoint script and make executable
COPY apps/frontend/docker-entrypoint-dev.sh /docker-entrypoint-dev.sh
RUN chmod +x /docker-entrypoint-dev.sh

# Expose port
EXPOSE 3003

# Entrypoint runs as root, builds shared, fixes permissions, then switches to nodejs user
ENTRYPOINT ["/docker-entrypoint-dev.sh"]

# Start Vite dev server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3003"]