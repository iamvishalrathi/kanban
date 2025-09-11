// Test Supabase Database Connection
const { sequelize } = require('./models');

async function testConnection() {
  try {
    console.log('🔍 Testing Supabase database connection...');
    
    await sequelize.authenticate();
    console.log('✅ Database connection successful!');
    
    console.log('📊 Database info:');
    console.log(`   Dialect: ${sequelize.getDialect()}`);
    console.log(`   Database: ${sequelize.config.database}`);
    console.log(`   Host: ${sequelize.config.host}:${sequelize.config.port}`);
    
    // Test table creation
    console.log('\n🔧 Testing table synchronization...');
    await sequelize.sync({ logging: false });
    console.log('✅ Tables synchronized successfully!');
    
    console.log('\n🎉 Supabase is ready to use!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('\n🔧 Troubleshooting tips:');
    console.log('1. Check your DATABASE_URL in .env');
    console.log('2. Verify your Supabase credentials');
    console.log('3. Ensure your Supabase project is active');
  } finally {
    await sequelize.close();
    process.exit(0);
  }
}

testConnection();