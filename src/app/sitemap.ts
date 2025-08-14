import { MetadataRoute } from 'next';
import { nocoDBService } from '@/lib/nocodb';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2b-design-stash.vercel.app';
  
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}?category=brand+identity`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}?category=web+design`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}?category=social+media`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}?category=events+%26+conferences`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}?category=sales+enablement`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}?category=content+marketing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}?category=email+marketing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];

  try {
    // Fetch all assets for individual design pages
    const assets = await nocoDBService.getAssets();
    
    // Filter out any assets without valid slugs
    const validAssets = assets.filter(asset => asset.slug && asset.slug.length > 0);
    
    const designPages: MetadataRoute.Sitemap = validAssets.map((asset) => ({
      url: `${baseUrl}/design/${asset.slug}`,
      lastModified: new Date(asset.created_at),
      changeFrequency: 'weekly',
      priority: 0.9,
    }));

    return [...staticPages, ...designPages];
  } catch (error) {
    console.warn('Could not generate sitemap for design pages during build:', error);
    // Return only static pages if there's an error (common during build without DB access)
    return staticPages;
  }
}