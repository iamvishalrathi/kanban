-- Initialize Kanban database

-- Create development database if it doesn't exist
SELECT 'CREATE DATABASE kanban_dev'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kanban_dev')\gexec

-- Create test database if it doesn't exist
SELECT 'CREATE DATABASE kanban_test'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kanban_test')\gexec

-- Create production database if it doesn't exist (usually handled by cloud provider)
SELECT 'CREATE DATABASE kanban_prod'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'kanban_prod')\gexec

-- Enable necessary extensions
\c kanban_dev;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

\c kanban_test;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

\c kanban_prod;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";