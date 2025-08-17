/**
 * Test script to verify NocoDB API connection and table structure
 * 
 * Usage: node scripts/test-api.js
 */

const fs = require('fs');
const path = require('path');

// Try to load environment variables from .env.local
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envVars = {};
    
    envContent.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key.trim()] = valueParts.join('=').trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return envVars;
  }
  return {};
}

const envVars = loadEnvFile();
const NOCODB_API_URL = envVars.NOCODB_API_URL || process.env.NOCODB_API_URL;
const NOCODB_API_TOKEN = envVars.NOCODB_API_TOKEN || process.env.NOCODB_API_TOKEN;

if (!NOCODB_API_URL || !NOCODB_API_TOKEN) {
  console.error('❌ Missing NOCODB_API_URL or NOCODB_API_TOKEN in environment variables');
  console.error('Please make sure these are set in your .env.local file or as environment variables');
  process.exit(1);
}

async function testConnection() {
  console.log('🔍 Testing NocoDB connection...');
  console.log(`API URL: ${NOCODB_API_URL}`);
  
  try {
    // Test reading data
    console.log('\n1. Testing READ operation...');
    const readResponse = await fetch(NOCODB_API_URL, {
      headers: {
        'Content-Type': 'application/json',
        'xc-token': NOCODB_API_TOKEN,
      },
    });

    if (!readResponse.ok) {
      throw new Error(`Read failed: ${readResponse.status} ${readResponse.statusText}`);
    }

    const data = await readResponse.json();
    console.log(`✅ Successfully fetched ${data.list?.length || 0} records`);
    
    // Show structure of first record
    if (data.list && data.list.length > 0) {
      const firstRecord = data.list[0];
      console.log('\n📋 First record structure:');
      console.log('Available fields:', Object.keys(firstRecord));
      console.log('Has slug field:', 'slug' in firstRecord ? '✅ Yes' : '❌ No');
      
      if ('slug' in firstRecord) {
        console.log('Slug value:', firstRecord.slug || '(empty)');
      }
    }

    // Test update endpoint structure
    console.log('\n2. Testing UPDATE endpoint structure...');
    const baseUrl = NOCODB_API_URL.split('?')[0];
    console.log(`Base URL for updates: ${baseUrl}`);
    
    if (data.list && data.list.length > 0) {
      const testId = data.list[0].Id || data.list[0].id;
      const updateUrl = `${baseUrl}/${testId}`;
      console.log(`Example update URL: ${updateUrl}`);
      
      // Test with a dry-run (just check if endpoint exists)
      console.log('\n3. Testing UPDATE endpoint (dry run)...');
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'xc-token': NOCODB_API_TOKEN,
        },
        body: JSON.stringify({
          // Empty body to test endpoint existence
        }),
      });
      
      console.log(`Update endpoint response: ${updateResponse.status} ${updateResponse.statusText}`);
      
      if (updateResponse.status === 400) {
        console.log('✅ Update endpoint exists (400 is expected for empty body)');
      } else if (updateResponse.status === 200) {
        console.log('✅ Update endpoint works');
      } else {
        const errorText = await updateResponse.text();
        console.log('❌ Update endpoint issue:', errorText);
      }
    }

  } catch (error) {
    console.error('💥 Connection test failed:', error.message);
  }
}

// Run the test
testConnection();