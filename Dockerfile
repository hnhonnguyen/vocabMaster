# Multi-stage build for Next.js application
FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app

# Copy package files
COPY package.json ./
RUN npm install && npm cache clean --force

# Rebuild the source code only when needed
FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Environment variables for build
ARG DATABASE_URL
ENV DATABASE_URL=$DATABASE_URL

# Build the application
RUN npm run build

# Production image
FROM node:18-alpine AS runner
WORKDIR /app

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Install runtime dependencies for better-sqlite3
RUN apk add --no-cache python3 make g++

# Copy necessary files
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/data ./data
COPY --from=builder /app/package.json ./package.json

# Create public directory if it doesn't exist
RUN mkdir -p ./public

# Set permissions
RUN chown -R nextjs:nodejs /app
USER nextjs

# Expose port
EXPOSE 3000

# Environment variables
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Start the application
CMD ["npx", "next", "start"]