// Check database users and create test user if needed
const { User } = require('./models');
const bcrypt = require('bcryptjs');

async function checkUsers() {
  try {
    console.log('🔍 Checking existing users...');
    
    const users = await User.findAll({
      attributes: ['id', 'email', 'username', 'firstName', 'lastName', 'isActive'],
      limit: 10
    });
    
    console.log('👥 Found users:', users.length);
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.username}) - Active: ${user.isActive}`);
    });
    
    if (users.length === 0) {
      console.log('📝 No users found. Creating test user...');
      
      const hashedPassword = await bcrypt.hash('password123', 12);
      
      const testUser = await User.create({
        username: 'testuser',
        email: 'test@example.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'User',
        isActive: true
      });
      
      console.log('✅ Test user created:');
      console.log(`   Email: test@example.com`);
      console.log(`   Password: password123`);
      console.log(`   ID: ${testUser.id}`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
  }
  
  process.exit(0);
}

checkUsers();