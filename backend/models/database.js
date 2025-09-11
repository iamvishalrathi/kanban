const { Sequelize } = require('sequelize');
require('dotenv').config();

// Determine database configuration based on environment
let sequelize;

if (process.env.DB_DIALECT === 'sqlite' || process.env.DATABASE_URL?.includes('sqlite:')) {
  // SQLite configuration for local development
  const storage = process.env.DATABASE_URL?.replace('sqlite:', '') || './dev-database.sqlite';
  console.log(`🗄️  Using SQLite database: ${storage}`);

  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: storage,
    logging: false,
  });
} else {
  // PostgreSQL configuration (Supabase)
  console.log('🐘 Using PostgreSQL database');

  const dbConfig = process.env.DATABASE_URL || {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };

  sequelize = new Sequelize(dbConfig, {
    dialectOptions: {
      ssl: process.env.NODE_ENV === 'production' ? {
        require: true,
        rejectUnauthorized: false
      } : false,
      // Add network-specific options
      connectTimeout: 20000, // 20 seconds
      socketTimeout: 20000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 0,
    },
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    pool: {
      max: 5, // Reduced for better connection management
      min: 0,
      acquire: 60000, // Increased to 60 seconds
      idle: 10000,
      evict: 1000,
      handleDisconnects: true
    },
    retry: {
      match: [
        /ETIMEDOUT/,
        /EHOSTUNREACH/,
        /ECONNRESET/,
        /ECONNREFUSED/,
        /ENOTFOUND/,
        /EAI_AGAIN/,
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/
      ],
      max: 3
    }
  });
}

module.exports = sequelize;
