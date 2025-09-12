#!/bin/sh

# Exit on any error
set -e

echo "Starting Kanban Application..."

# Wait for database to be ready if DATABASE_URL is set
if [ -n "$DATABASE_URL" ]; then
    echo "Waiting for database connection..."
    until pg_isready -d "$DATABASE_URL" > /dev/null 2>&1; do
        echo "Waiting for database..."
        sleep 2
    done
    echo "Database is ready!"
fi

# Change to backend directory
cd /app/backend

# Run database migrations if needed
if [ "$RUN_MIGRATIONS" = "true" ]; then
    echo "Running database migrations..."
    npm run migrate || echo "Migration failed or not configured"
fi

# Seed database if needed
if [ "$RUN_SEEDS" = "true" ]; then
    echo "Seeding database..."
    npm run seed || echo "Seeding failed or not configured"
fi

echo "Starting Express server..."

# Start the Express server with proper signal handling
exec node server.js