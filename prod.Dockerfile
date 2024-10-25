# Build stage
FROM node:20-alpine3.19 AS builder

# Add necessary build tools
RUN apk add --no-cache python3 make g++

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install ALL dependencies (including dev dependencies needed for build)
RUN npm ci && \
    npm install -g @nestjs/cli

# Copy Prisma schema and generate client
COPY prisma ./prisma/
RUN npx prisma generate

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Install production dependencies
RUN npm ci --only=production

# Production stage
FROM node:20-alpine3.19 AS runner

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nodeuser

WORKDIR /app


# Copy package files first
COPY package*.json ./

# Copy production node_modules
COPY --from=builder /app/node_modules ./node_modules

# Copy compiled application
COPY --from=builder /app/dist ./dist

COPY .env /app/.env

# Copy Prisma client
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Set proper ownership
RUN chown -R nodeuser:nodejs /app

# Use non-root user
USER nodeuser

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD wget --spider http://localhost:3000 || exit 1

# Start the application
CMD ["node", "dist/main"]
