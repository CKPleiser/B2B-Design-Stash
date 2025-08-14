import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Generate SEO-friendly slug from title and company
export function generateSlug(title: string, company: string, id?: string | number): string {
  const baseSlug = `${title}-${company}`
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  
  // Add year for uniqueness if available
  const year = new Date().getFullYear();
  const slug = `${baseSlug}-${year}`;
  
  // Add ID suffix if provided for guaranteed uniqueness
  if (id) {
    const idString = String(id);
    const idSuffix = idString.length > 4 ? idString.slice(-4) : idString;
    return `${slug}-${idSuffix}`;
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
