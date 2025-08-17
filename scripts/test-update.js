/**
 * Test script to figure out the correct NocoDB update API format
 * 
 * Usage: node scripts/test-update.js
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
  process.exit(1);
}

async function testUpdateFormats() {
  console.log('🔍 Testing different NocoDB update formats...');
  
  try {
    // First, get a record to test with
    const readResponse = await fetch(NOCODB_API_URL, {
      headers: {
        'Content-Type': 'application/json',
        'xc-token': NOCODB_API_TOKEN,
      },
    });

    if (!readResponse.ok) {
      throw new Error(`Failed to fetch records: ${readResponse.statusText}`);
    }

    const data = await readResponse.json();
    
    if (!data.list || data.list.length === 0) {
      console.log('❌ No records found to test with');
      return;
    }

    const testRecord = data.list[0];
    const recordId = testRecord.Id || testRecord.id;
    
    console.log(`\n📋 Testing with record ID: ${recordId}`);
    console.log('Current title:', testRecord.title);
    console.log('Has slug field:', 'slug' in testRecord ? '✅ Yes' : '❌ No');
    
    if (!('slug' in testRecord)) {
      console.log('\n⚠️  IMPORTANT: The "slug" field does not exist in your NocoDB table!');
      console.log('Please add a "slug" field (SingleLineText type) to your table first.');
      return;
    }

    const baseUrl = NOCODB_API_URL.split('?')[0];
    console.log(`\nBase URL: ${baseUrl}`);

    // Test different update methods
    const testMethods = [
      {
        name: 'PUT with ID in body',
        method: 'PUT',
        url: baseUrl,
        body: { Id: recordId, slug: 'test-slug-1' }
      },
      {
        name: 'PATCH with ID in body', 
        method: 'PATCH',
        url: baseUrl,
        body: { Id: recordId, slug: 'test-slug-2' }
      },
      {
        name: 'PUT with ID in URL',
        method: 'PUT', 
        url: `${baseUrl}/${recordId}`,
        body: { slug: 'test-slug-3' }
      },
      {
        name: 'PATCH with ID in URL',
        method: 'PATCH',
        url: `${baseUrl}/${recordId}`, 
        body: { slug: 'test-slug-4' }
      }
    ];

    for (const test of testMethods) {
      console.log(`\n🧪 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);
      console.log(`   Method: ${test.method}`);
      console.log(`   Body: ${JSON.stringify(test.body)}`);
      
      try {
        const response = await fetch(test.url, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
            'xc-token': NOCODB_API_TOKEN,
          },
          body: JSON.stringify(test.body),
        });
        
        console.log(`   Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log('   ✅ SUCCESS! This method works.');
          const result = await response.json();
          console.log('   Result:', JSON.stringify(result, null, 2));
          return; // Stop at first successful method
        } else {
          const errorText = await response.text();
          console.log(`   ❌ Failed: ${errorText}`);
        }
      } catch (error) {
        console.log(`   ❌ Error: ${error.message}`);
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n💡 None of the standard methods worked. Let me check the NocoDB documentation...');
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testUpdateFormats();