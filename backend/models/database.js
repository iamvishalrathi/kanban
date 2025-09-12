const { Sequelize } = require('sequelize');
require('dotenv').config();

// PostgreSQL configuration (Supabase)
console.log('🐘 Using PostgreSQL database');

let sequelize;

if (process.env.DATABASE_URL) {
  // Use connection string
  sequelize = new Sequelize(process.env.DATABASE_URL, {
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
} else {
  // Use individual config options
  sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
    dialect: 'postgres',
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
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
