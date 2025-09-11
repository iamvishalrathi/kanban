require('dotenv').config();
const { Pool } = require('pg');
const dns = require('dns');
const { promisify } = require('util');

const lookup = promisify(dns.lookup);

async function testDatabaseConnections() {
    console.log('🔍 Diagnosing Supabase connection issues...\n');
    
    // Test DNS resolution for both endpoints
    const endpoints = [
        'db.tcvuvwqvlucmkqwplawx.supabase.co',
        'aws-0-ap-south-1.pooler.supabase.com'
    ];
    
    for (const endpoint of endpoints) {
        try {
            console.log(`🌐 Testing DNS resolution for ${endpoint}...`);
            const result = await lookup(endpoint);
            console.log(`✅ Resolved to: ${result.address} (${result.family === 4 ? 'IPv4' : 'IPv6'})`);
        } catch (error) {
            console.log(`❌ DNS resolution failed for ${endpoint}:`, error.message);
        }
    }
    
    console.log('\n🔗 Testing database connections...\n');
    
    // Connection strings to test
    const connections = [
        {
            name: 'Direct Connection (IPv6)',
            url: 'postgresql://postgres.tcvuvwqvlucmkqwplawx:h7HcmP.$tbmn8$*@db.tcvuvwqvlucmkqwplawx.supabase.co:5432/postgres'
        },
        {
            name: 'Transaction Pooler (IPv4)',
            url: 'postgresql://postgres.tcvuvwqvlucmkqwplawx:h7HcmP.$tbmn8$*@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
        }
    ];
    
    for (const conn of connections) {
        console.log(`🔄 Testing ${conn.name}...`);
        
        const pool = new Pool({
            connectionString: conn.url,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 5000,
        });
        
        try {
            const client = await pool.connect();
            const result = await client.query('SELECT version()');
            console.log(`✅ ${conn.name} - Connection successful!`);
            console.log(`   PostgreSQL version: ${result.rows[0].version.split(' ')[1]}`);
            client.release();
        } catch (error) {
            console.log(`❌ ${conn.name} - Connection failed:`, error.message);
        } finally {
            await pool.end();
        }
    }
    
    console.log('\n📋 Current environment configuration:');
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL}`);
    console.log(`   Node.js version: ${process.version}`);
    console.log(`   Platform: ${process.platform}`);
}

testDatabaseConnections().catch(console.error);