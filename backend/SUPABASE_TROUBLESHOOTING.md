# Supabase Database Setup Issues & Solutions

## Current Status
❌ Direct Connection (IPv6): DNS resolution fails on your network
✅ Transaction Pooler (IPv4): DNS resolves but authentication fails

## Solution Options

### Option 1: Fix Pooler Authentication (Recommended)
The pooler connection requires a specific username format. Try these:

**Format 1: Add project reference**
```
postgresql://postgres.tcvuvwqvlucmkqwplawx.tcvuvwqvlucmkqwplawx:h7HcmP.$tbmn8$*@aws-0-ap-south-1.pooler.supabase.com:5432/postgres
```

**Format 2: Use full project ID**
```
postgresql://postgres:h7HcmP.$tbmn8$*@aws-0-ap-south-1.pooler.supabase.com:5432/postgres?project=tcvuvwqvlucmkqwplawx
```

### Option 2: Use Session Mode Port
Try port 6543 with session mode:
```
postgresql://postgres.tcvuvwqvlucmkqwplawx:h7HcmP.$tbmn8$*@aws-0-ap-south-1.pooler.supabase.com:6543/postgres
```

### Option 3: Get Fresh Connection String from Supabase
1. Go to your Supabase project: https://supabase.com/dashboard/project/tcvuvwqvlucmkqwplawx
2. Go to Settings > Database
3. Under "Connection parameters", copy the exact connection string

## Network Configuration Issues

Your network doesn't support IPv6, which is why the direct connection fails:
- Direct connection: `db.tcvuvwqvlucmkqwplawx.supabase.co` (IPv6) ❌
- Pooler connection: `aws-0-ap-south-1.pooler.supabase.com` (IPv4) ✅

## Testing Instructions

1. Update your DATABASE_URL with one of the formats above
2. Run: `node test-supabase.js`
3. If successful, you'll see: "✅ Database connection successful!"

## Alternative: Create New Project (If Issues Persist)

If authentication continues to fail:
1. Create a new Supabase project
2. Get fresh connection strings
3. Update your .env file

## Production Deployment Notes

For production, use the same working connection string format that works in development.