require('dotenv').config();
const { Redis } = require('@upstash/redis');

async function testRedisConnection() {
    console.log('🔴 Testing Upstash Redis connection...');
    
    const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });

    try {
        // Test basic operations
        await redis.set('test:connection', 'success');
        const result = await redis.get('test:connection');
        
        if (result === 'success') {
            console.log('✅ Redis connection successful!');
            console.log('📊 Redis Info:');
            console.log(`   URL: ${process.env.UPSTASH_REDIS_REST_URL}`);
            console.log('   Status: Connected');
        } else {
            console.log('❌ Redis test failed - unexpected result');
        }
        
        // Clean up test key
        await redis.del('test:connection');
        
    } catch (error) {
        console.log('❌ Redis connection failed:', error.message);
        console.log('🔧 Troubleshooting tips:');
        console.log('1. Check your UPSTASH_REDIS_REST_URL in .env');
        console.log('2. Check your UPSTASH_REDIS_REST_TOKEN in .env');
        console.log('3. Verify your Upstash Redis instance is active');
        console.log('4. Check your Upstash dashboard for the correct credentials');
    }
}

testRedisConnection();