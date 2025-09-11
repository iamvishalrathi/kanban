#!/usr/bin/env node

/**
 * Supabase Setup Script
 * This script helps you configure Supabase for both development and production
 */

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupSupabase() {
  console.log('\n🚀 Supabase Configuration Setup');
  console.log('================================\n');

  console.log('Please provide your Supabase connection details:');
  console.log('(You can find these in your Supabase project settings)\n');

  const host = await question('Enter your Supabase host (e.g., aws-0-us-east-1.pooler.supabase.com): ');
  const projectRef = await question('Enter your project reference (e.g., abcdefghijklmnop): ');
  const password = await question('Enter your database password: ');
  const port = await question('Enter port (default 6543): ') || '6543';

  // Construct connection details
  const connectionString = `postgresql://postgres.${projectRef}:${password}@${host}:${port}/postgres`;
  const dbUser = `postgres.${projectRef}`;

  console.log('\n📝 Generating environment files...\n');

  // Development environment
  const devEnv = `# Local Development Environment Configuration
# Supabase PostgreSQL Configuration

# Server Configuration
PORT=3001
NODE_ENV=development

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL=${connectionString}
DB_DIALECT=postgres
DB_HOST=${host}
DB_PORT=${port}
DB_NAME=postgres
DB_USER=${dbUser}
DB_PASSWORD=${password}

# Redis Configuration (Optional for development)
REDIS_ENABLED=false
# REDIS_URL=redis://localhost:6379
# REDIS_HOST=localhost
# REDIS_PORT=6379

# JWT Configuration
JWT_SECRET=dev-jwt-secret-key-minimum-32-chars-long
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_ENABLED=false

# Email Configuration (Disabled for development)
SENDGRID_ENABLED=false
# SENDGRID_API_KEY=your-sendgrid-api-key
# SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# WebSocket Configuration
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000`;

  // Production environment template
  const prodEnv = `# Production Environment Configuration
# Copy these variables to your Render dashboard

# Server Configuration
PORT=10000
NODE_ENV=production

# Database Configuration (Supabase PostgreSQL)
DATABASE_URL=${connectionString}
DB_DIALECT=postgres
DB_HOST=${host}
DB_PORT=${port}
DB_NAME=postgres
DB_USER=${dbUser}
DB_PASSWORD=${password}

# Redis Configuration (Upstash for production)
REDIS_ENABLED=true
REDIS_URL=rediss://default:[PASSWORD]@[UPSTASH-HOST]:6380
REDIS_HOST=[UPSTASH-HOST]
REDIS_PORT=6380

# JWT Configuration
JWT_SECRET=your-super-secure-production-jwt-secret-minimum-32-characters
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.vercel.app

# Rate Limiting (Enabled in production)
RATE_LIMIT_ENABLED=true

# Email Configuration (SendGrid for production)
SENDGRID_ENABLED=true
SENDGRID_API_KEY=SG.your-production-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@yourdomain.com

# WebSocket Configuration
WS_PING_TIMEOUT=60000
WS_PING_INTERVAL=25000`;

  // Write files
  fs.writeFileSync('.env.supabase.dev', devEnv);
  fs.writeFileSync('.env.supabase.prod', prodEnv);

  console.log('✅ Created .env.supabase.dev');
  console.log('✅ Created .env.supabase.prod');

  const useNow = await question('\nDo you want to use these settings now? (y/n): ');
  
  if (useNow.toLowerCase() === 'y') {
    // Backup existing .env
    if (fs.existsSync('.env')) {
      fs.copyFileSync('.env', '.env.backup');
      console.log('✅ Backed up existing .env to .env.backup');
    }
    
    // Copy dev environment to .env
    fs.copyFileSync('.env.supabase.dev', '.env');
    console.log('✅ Activated Supabase development configuration');
  }

  console.log('\n🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Start your backend: npm run dev');
  console.log('2. Test database connection');
  console.log('3. For production: copy .env.supabase.prod values to Render dashboard');
  
  rl.close();
}

setupSupabase().catch(console.error);