import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate SEO-friendly slug from title, company, category, and tags
export function generateSlug(
  title: string, 
  company: string, 
  id?: string | number, 
  category?: string,
  primaryTag?: string
): string {
  // Clean and prepare each part
  const cleanPart = (str: string) => {
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
  const removeFillerWords = (str: string) => {
    const fillers = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];
    const words = str.split('-');
    return words.filter(word => !fillers.includes(word)).join('-');
  };

  // Build the slug parts in SEO priority order
  const parts: string[] = [];
  
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

// Extract slug from full URL path
export function extractSlugFromPath(path: string): string {
  const segments = path.split('/');
  return segments[segments.length - 1] || '';
}

// Validate slug format
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
