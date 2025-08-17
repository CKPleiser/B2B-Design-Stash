/**
 * Script to discover the correct NocoDB API format for your instance
 * 
 * Usage: node scripts/find-api-format.js
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

async function analyzeApiStructure() {
  console.log('🔍 Analyzing your NocoDB API structure...');
  console.log(`Current URL: ${NOCODB_API_URL}`);
  
  // Parse the current URL to understand the structure
  const url = new URL(NOCODB_API_URL);
  const pathParts = url.pathname.split('/').filter(part => part.length > 0);
  
  console.log('URL Path parts:', pathParts);
  
  // Common patterns:
  // /api/v1/db/data/v1/{projectId}/{tableId}
  // /api/v2/tables/{tableId}/records
  
  let projectId = null;
  let tableId = null;
  let apiVersion = null;
  
  if (pathParts.includes('v1') && pathParts.includes('data')) {
    // V1 API format
    apiVersion = 'v1';
    const dataIndex = pathParts.findIndex(part => part === 'data');
    if (dataIndex >= 0 && pathParts.length > dataIndex + 3) {
      projectId = pathParts[dataIndex + 2];
      tableId = pathParts[dataIndex + 3];
    }
  } else if (pathParts.includes('v2') && pathParts.includes('tables')) {
    // V2 API format
    apiVersion = 'v2';
    const tablesIndex = pathParts.findIndex(part => part === 'tables');
    if (tablesIndex >= 0 && pathParts.length > tablesIndex + 1) {
      tableId = pathParts[tablesIndex + 1];
    }
  }
  
  console.log(`\nDetected API structure:`);
  console.log(`API Version: ${apiVersion}`);
  console.log(`Project ID: ${projectId || 'not detected'}`);
  console.log(`Table ID: ${tableId || 'not detected'}`);
  
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
    
    console.log(`\n📋 Test record ID: ${recordId}`);
    console.log('Has slug field:', 'slug' in testRecord ? '✅ Yes' : '❌ No');
    
    if (!('slug' in testRecord)) {
      console.log('\n⚠️  IMPORTANT: Add a "slug" field to your NocoDB table first!');
      return;
    }

    // Test different update URL patterns
    const baseUrl = url.origin;
    const testUrls = [];
    
    if (apiVersion === 'v1' && projectId && tableId) {
      testUrls.push({
        name: 'V1 API with record ID',
        url: `${baseUrl}/api/v1/db/data/v1/${projectId}/${tableId}/${recordId}`,
        method: 'PATCH'
      });
    }
    
    if (apiVersion === 'v2' && tableId) {
      testUrls.push({
        name: 'V2 API with record ID',
        url: `${baseUrl}/api/v2/tables/${tableId}/records/${recordId}`,
        method: 'PATCH'
      });
      testUrls.push({
        name: 'V2 API bulk update',
        url: `${baseUrl}/api/v2/tables/${tableId}/records`,
        method: 'PATCH',
        body: [{ Id: recordId, slug: 'test-slug' }]
      });
    }
    
    // Generic patterns to try
    testUrls.push(
      {
        name: 'Generic V1 pattern',
        url: `${baseUrl}/api/v1/db/data/${tableId}/${recordId}`,
        method: 'PATCH'
      },
      {
        name: 'Generic records endpoint',
        url: `${baseUrl}/api/v1/db/data/${tableId}`,
        method: 'PATCH',
        body: { Id: recordId, slug: 'test-slug' }
      }
    );

    console.log(`\n🧪 Testing ${testUrls.length} different update patterns...\n`);

    for (const test of testUrls) {
      console.log(`Testing: ${test.name}`);
      console.log(`  URL: ${test.url}`);
      console.log(`  Method: ${test.method}`);
      
      const body = test.body || { slug: 'test-slug' };
      console.log(`  Body: ${JSON.stringify(body)}`);
      
      try {
        const response = await fetch(test.url, {
          method: test.method,
          headers: {
            'Content-Type': 'application/json',
            'xc-token': NOCODB_API_TOKEN,
          },
          body: JSON.stringify(body),
        });
        
        console.log(`  Response: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          console.log('  ✅ SUCCESS! This format works.\n');
          
          // Save the working format
          const workingFormat = {
            url: test.url,
            method: test.method,
            bodyFormat: test.body ? 'bulk' : 'single',
            example: {
              url: test.url,
              method: test.method,
              body: body
            }
          };
          
          const formatPath = path.join(__dirname, '..', 'working-api-format.json');
          fs.writeFileSync(formatPath, JSON.stringify(workingFormat, null, 2));
          console.log(`💾 Saved working format to: ${formatPath}`);
          return workingFormat;
        } else {
          const errorText = await response.text();
          console.log(`  ❌ Failed: ${errorText.substring(0, 100)}...\n`);
        }
      } catch (error) {
        console.log(`  ❌ Error: ${error.message}\n`);
      }
      
      // Small delay between attempts
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    
    console.log('💡 None of the standard patterns worked.');
    console.log('Your NocoDB instance might use a custom API structure.');
    console.log('Please check your NocoDB documentation or API explorer.');
    
  } catch (error) {
    console.error('💥 Analysis failed:', error.message);
  }
}

// Run the analysis
analyzeApiStructure();