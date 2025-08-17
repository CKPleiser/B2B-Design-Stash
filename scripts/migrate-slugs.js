/**
 * Script to generate and update slugs for all assets in NocoDB
 * 
 * Before running this script:
 * 1. Add a 'slug' field to your NocoDB table (SingleLineText type)
 * 2. Make sure NOCODB_API_URL and NOCODB_API_TOKEN are set in your .env
 * 
 * Usage: node scripts/migrate-slugs.js
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

// Generate SEO-friendly slug function (copied from utils.ts)
function generateSlug(title, company, id, category, primaryTag) {
  // Clean and prepare each part
  const cleanPart = (str) => {
    return str
      .toLowerCase()
      .normalize('NFD') // Normalize unicode characters
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  };

  // Remove common filler words for better SEO
  const removeFillerWords = (str) => {
    const fillers = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = str.split('-');
    return words.filter(word => !fillers.includes(word)).join('-');
  };

  // Build the slug parts in SEO priority order
  const parts = [];
  
  // 1. Title (most important for SEO) - shortened if needed
  if (title) {
    let cleanTitle = cleanPart(title);
    cleanTitle = removeFillerWords(cleanTitle);
    // Keep only first 3-4 words if title is long
    const titleWords = cleanTitle.split('-');
    if (titleWords.length > 4) {
      cleanTitle = titleWords.slice(0, 4).join('-');
    }
    parts.push(cleanTitle);
  }
  
  // 2. Primary tag (adds context and keywords)
  if (primaryTag && primaryTag !== 'all') {
    const cleanTag = cleanPart(primaryTag);
    // Only add if it's not already in the title
    if (!parts[0]?.includes(cleanTag)) {
      parts.push(cleanTag);
    }
  }
  
  // 3. Category (for structure and context)
  if (category && category !== 'all') {
    const cleanCategory = cleanPart(category);
    // Only add if different from tag and not in title
    if (!parts.join('-').includes(cleanCategory)) {
      parts.push(cleanCategory);
    }
  }
  
  // 4. Company name (brand recognition)
  if (company) {
    const cleanCompany = cleanPart(company);
    // Shorten company name if needed
    const companyWords = cleanCompany.split('-');
    if (companyWords.length > 2) {
      parts.push(companyWords.slice(0, 2).join('-'));
    } else {
      parts.push(cleanCompany);
    }
  }
  
  // Combine the parts
  let slug = parts.join('-');
  
  // Ensure total length is SEO-friendly (50-60 chars ideal, max 70)
  const maxLength = 60;
  if (slug.length > maxLength) {
    // Try to cut at word boundary
    slug = slug.substring(0, maxLength);
    const lastDash = slug.lastIndexOf('-');
    if (lastDash > 40) { // Keep at least 40 chars
      slug = slug.substring(0, lastDash);
    }
  }
  
  // Add ID suffix for uniqueness (keep it short)
  if (id) {
    const idString = String(id);
    // Use last 6 chars of ID or full ID if shorter
    const idSuffix = idString.length > 6 ? idString.slice(-6) : idString;
    slug = `${slug}-${idSuffix}`;
  }
  
  // Ensure slug is not empty
  if (!slug) {
    slug = `design-${id || Date.now()}`;
  }
  
  return slug;
}

async function fetchAllAssets() {
  const url = new URL(NOCODB_API_URL);
  url.searchParams.set('limit', '1000'); // Get all assets
  
  console.log('🔍 Fetching all assets from NocoDB...');
  
  const response = await fetch(url.toString(), {
    headers: {
      'Content-Type': 'application/json',
      'xc-token': NOCODB_API_TOKEN,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch assets: ${response.statusText}`);
  }

  const data = await response.json();
  return data.list || [];
}

async function updateAssetSlug(assetId, slug) {
  // NocoDB V2 API bulk update format: PATCH /api/v2/tables/{tableId}/records
  // with array of records to update
  const baseUrl = NOCODB_API_URL.split('?')[0];
  
  const response = await fetch(baseUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'xc-token': NOCODB_API_TOKEN,
    },
    body: JSON.stringify([{
      Id: assetId,
      slug: slug
    }]),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Failed to update asset ${assetId}: ${response.status} ${errorText}`);
  }

  return await response.json();
}

async function migrateAllSlugs() {
  try {
    console.log('🚀 Starting slug migration...');
    
    const assets = await fetchAllAssets();
    console.log(`📊 Found ${assets.length} assets to process`);
    
    if (assets.length === 0) {
      console.log('ℹ️  No assets found. Exiting.');
      return;
    }

    const results = {
      updated: 0,
      skipped: 0,
      errors: 0,
      slugs: []
    };

    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      const id = asset.Id || asset.id;
      const title = asset.title || '';
      const company = asset.company || '';
      const category = asset.category || '';
      const tags = asset.tags ? asset.tags.split(',').map(tag => tag.trim()) : [];
      const primaryTag = tags.length > 0 ? tags[0] : undefined;

      console.log(`\n📝 Processing ${i + 1}/${assets.length}: "${title}" by ${company}`);

      // Skip if slug already exists
      if (asset.slug && asset.slug.trim()) {
        console.log(`   ⏭️  Skipping - slug already exists: ${asset.slug}`);
        results.skipped++;
        continue;
      }

      try {
        // Generate the new SEO-friendly slug
        const newSlug = generateSlug(title, company, id, category, primaryTag);
        console.log(`   🏷️  Generated slug: ${newSlug}`);

        // Update the asset in NocoDB
        await updateAssetSlug(id, newSlug);
        console.log(`   ✅ Updated successfully`);

        results.updated++;
        results.slugs.push({
          id,
          title,
          company,
          category,
          primaryTag,
          slug: newSlug
        });

        // Add a small delay to avoid overwhelming the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        console.error(`   ❌ Error updating asset ${id}: ${error.message}`);
        results.errors++;
      }
    }

    // Print summary
    console.log('\n🎉 Migration completed!');
    console.log(`✅ Updated: ${results.updated}`);
    console.log(`⏭️  Skipped: ${results.skipped}`);
    console.log(`❌ Errors: ${results.errors}`);

    // Save a report
    const reportPath = path.join(__dirname, '..', 'slug-migration-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
    console.log(`📄 Report saved to: ${reportPath}`);

    if (results.errors > 0) {
      console.log('\n⚠️  Some assets failed to update. Check the logs above.');
      process.exit(1);
    }

  } catch (error) {
    console.error('💥 Migration failed:', error.message);
    process.exit(1);
  }
}

// Run the migration
migrateAllSlugs();