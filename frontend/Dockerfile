# ============================================
# Multi-stage Dockerfile for Frontend
# Optimized for production with minimal image size
# ============================================

# Stage 1: Dependencies stage
FROM node:26-slim AS deps
WORKDIR /app

# Install necessary packages for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies with clean install for reproducible builds
RUN npm ci --only=production --ignore-scripts && \
    # Copy node_modules to a separate location for production
    cp -R node_modules /tmp/prod_node_modules && \
    # Install all dependencies (including dev) for build
    npm ci --ignore-scripts

# Stage 2: Build stage
FROM node:26-slim AS builder
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application source
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build the Next.js application
RUN npm run build && \
    # Verify build output
    ls -lh .next

# Stage 3: Runtime stage (minimal production image)
FROM node:26-slim AS runner
WORKDIR /app

# Install curl for health checks and dumb-init for proper signal handling
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    dumb-init \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user for security
RUN groupadd -g 1001 nodejs && \
    useradd -u 1001 -g nodejs -s /bin/bash -m nextjs

# Set environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Copy production dependencies
COPY --from=deps /tmp/prod_node_modules ./node_modules

# Copy built application from builder stage
# Next.js standalone output includes only necessary files
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Switch to non-root user
USER nextjs

# Expose application port
EXPOSE 3000

# Health check configuration
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:3000 || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the Next.js application
CMD ["node", "server.js"]

# Labels for metadata
LABEL maintainer="Password Manager Team"
LABEL description="Password Manager Frontend - Next.js PWA"
LABEL version="1.0.0"
