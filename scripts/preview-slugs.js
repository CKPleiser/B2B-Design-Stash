/**
 * Preview script to see what slugs would be generated for all assets
 * This is a safe script that doesn't modify any data
 * 
 * Usage: node scripts/preview-slugs.js
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

async function previewSlugs() {
  try {
    console.log('🚀 Previewing slug generation...');
    
    const assets = await fetchAllAssets();
    console.log(`📊 Found ${assets.length} assets`);
    
    if (assets.length === 0) {
      console.log('ℹ️  No assets found. Exiting.');
      return;
    }

    console.log('\n' + '='.repeat(100));
    console.log('SLUG PREVIEW (First 10 assets)');
    console.log('='.repeat(100));

    const preview = assets.slice(0, 10);
    
    for (let i = 0; i < preview.length; i++) {
      const asset = preview[i];
      const id = asset.Id || asset.id;
      const title = asset.title || '';
      const company = asset.company || '';
      const category = asset.category || '';
      const tags = asset.tags ? asset.tags.split(',').map(tag => tag.trim()) : [];
      const primaryTag = tags.length > 0 ? tags[0] : undefined;

      const newSlug = generateSlug(title, company, id, category, primaryTag);
      
      console.log(`\n${i + 1}. ${title} (${company})`);
      console.log(`   Category: ${category}`);
      console.log(`   Primary Tag: ${primaryTag || 'none'}`);
      console.log(`   Current slug: ${asset.slug || 'none'}`);
      console.log(`   🏷️  NEW SLUG: ${newSlug}`);
      console.log(`   📏 Length: ${newSlug.length} chars`);
    }

    // Show statistics
    const stats = {
      total: assets.length,
      withSlugs: assets.filter(a => a.slug && a.slug.trim()).length,
      withoutSlugs: assets.filter(a => !a.slug || !a.slug.trim()).length
    };

    console.log('\n' + '='.repeat(100));
    console.log('STATISTICS');
    console.log('='.repeat(100));
    console.log(`Total assets: ${stats.total}`);
    console.log(`Already have slugs: ${stats.withSlugs}`);
    console.log(`Need new slugs: ${stats.withoutSlugs}`);
    
    if (stats.withoutSlugs > 0) {
      console.log(`\n✅ Ready to migrate ${stats.withoutSlugs} assets`);
      console.log('💡 Run "node scripts/migrate-slugs.js" to actually update the database');
    } else {
      console.log('\n🎉 All assets already have slugs!');
    }

  } catch (error) {
    console.error('💥 Preview failed:', error.message);
    process.exit(1);
  }
}

// Run the preview
previewSlugs();