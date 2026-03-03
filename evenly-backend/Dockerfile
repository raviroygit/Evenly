# Cloud Run optimized Dockerfile for Evenly Backend
FROM node:20-alpine AS builder

# Set working directory
WORKDIR /app

# Install dependencies for native modules
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for build)
RUN echo "📦 Installing dependencies..." && \
    npm ci && \
    echo "✅ Dependencies installed"

# Copy source code
COPY . .

# Verify source files exist
RUN echo "📁 Verifying source files..." && \
    ls -la src/ && \
    echo "✅ Source files found"

# Build the application
RUN echo "🔨 Building TypeScript..." && \
    npm run build && \
    echo "✅ Build completed" && \
    ls -la dist/ && \
    echo "✅ Dist folder created"

# Production stage
FROM node:20-alpine AS production

# Set working directory
WORKDIR /app

# Install only production dependencies
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S evenly -u 1001

# Copy package files
COPY package*.json ./

# Install only production dependencies
RUN echo "📦 Installing production dependencies..." && \
    npm ci --omit=dev && \
    echo "✅ Production dependencies installed"

# Copy built application from builder stage
COPY --from=builder /app/dist ./dist

# Copy necessary files (templates for emails) to dist/templates
# The code looks for templates relative to __dirname which is dist/services
COPY --from=builder /app/src/templates ./dist/templates

# Copy i18n email translation JSON (emailTranslator loads from __dirname/email/*.json at runtime)
COPY --from=builder /app/src/i18n/email ./dist/i18n/email

# Copy APNs push notification key
COPY --from=builder /app/certs ./certs

# Verify dist folder, templates, and i18n email files
RUN echo "✅ Final verification..." && \
    ls -la dist/ && \
    test -f dist/server.js && \
    echo "✅ server.js found" || echo "❌ server.js NOT found" && \
    ls -la dist/templates/ && \
    echo "✅ Email templates found" && \
    ls -la dist/i18n/email/ && \
    test -f dist/i18n/email/en.json && test -f dist/i18n/email/hi.json && \
    echo "✅ i18n email translations found"

# Change ownership of the app directory
RUN chown -R evenly:nodejs /app
USER evenly

# Expose port (Cloud Run uses PORT environment variable)
EXPOSE 8080

# Health check for Cloud Run
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:8080/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "dist/server.js"]
