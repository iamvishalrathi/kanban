# Multi-stage build for production deployment
FROM node:18-alpine AS frontend-build

# Set working directory for frontend
WORKDIR /app/frontend

# Copy frontend package files
COPY frontend/package*.json ./

# Install frontend dependencies
RUN npm ci --only=production

# Copy frontend source code
COPY frontend/ ./

# Build frontend for production
RUN npm run build

# Backend build stage
FROM node:18-alpine AS backend-build

# Set working directory for backend
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./

# Install backend dependencies including devDependencies for build
RUN npm ci

# Copy backend source code
COPY backend/ ./

# Remove devDependencies for production
RUN npm prune --production

# Production stage
FROM node:18-alpine AS production

# Install system dependencies
RUN apk add --no-cache \
    dumb-init \
    curl \
    postgresql-client

# Create app user for security
RUN addgroup -g 1001 -S nodejs && \
    adduser -S kanban -u 1001

# Set working directory
WORKDIR /app

# Copy backend from build stage
COPY --from=backend-build --chown=kanban:nodejs /app/backend ./backend

# Copy built frontend from build stage
COPY --from=frontend-build --chown=kanban:nodejs /app/frontend/dist ./frontend/dist

# Create necessary directories with proper permissions
RUN mkdir -p logs temp uploads && \
    chown -R kanban:nodejs logs temp uploads

# Copy startup script
COPY docker/start.sh ./start.sh
RUN chmod +x start.sh && chown kanban:nodejs start.sh

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Switch to non-root user
USER kanban

# Use dumb-init for proper signal handling
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["./start.sh"]
