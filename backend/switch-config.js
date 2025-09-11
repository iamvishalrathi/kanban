const fs = require('fs');
const path = require('path');

const configType = process.argv[2] || 'local';

const sourceFile = configType === 'local' ? '.env.local' : '.env.remote';
const targetFile = '.env';

const sourcePath = path.join(__dirname, sourceFile);
const targetPath = path.join(__dirname, targetFile);

if (fs.existsSync(sourcePath)) {
  fs.copyFileSync(sourcePath, targetPath);
  console.log(`✅ Switched to ${configType} configuration`);
  console.log(`📁 Copied ${sourceFile} to ${targetFile}`);

  if (configType === 'local') {
    console.log('🔧 Local development mode:');
    console.log('   - SQLite database');
    console.log('   - Redis disabled');
    console.log('   - Email disabled');
  } else {
    console.log('🌐 Remote production mode:');
    console.log('   - Supabase PostgreSQL');
    console.log('   - Upstash Redis');
    console.log('   - SendGrid email');
  }
} else {
  console.error(`❌ Configuration file ${sourceFile} not found`);
  process.exit(1);
}
