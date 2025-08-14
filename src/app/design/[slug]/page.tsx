import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { nocoDBService } from '@/lib/nocodb';
import { DesignPageComponent } from '@/components/design-page';
import { DesignStructuredData } from '@/components/design-structured-data';
import { ViewTracker } from '@/components/view-tracker';

interface DesignPageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for ISR
export async function generateStaticParams() {
  // During build time, if NocoDB is not available, return empty array
  // ISR will handle generation on-demand with fallback: 'blocking'
  try {
    const assets = await nocoDBService.getAssetsForStaticGeneration(50);
    
    return assets.map((asset) => ({
      slug: asset.slug,
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.warn('Could not pre-generate static params during build:', message);
    // Return empty array to allow on-demand generation
    return [];
  }
}

// Generate metadata for each design page
export async function generateMetadata({ params }: DesignPageProps): Promise<Metadata> {
  const { slug } = await params;
  const asset = await nocoDBService.getAssetBySlug(slug);
  
  if (!asset) {
    return {
      title: 'Design Not Found - B2B Design Stash',
      description: 'The requested design could not be found.',
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://b2b-design-stash.vercel.app';
  const pageUrl = `${siteUrl}/design/${asset.slug}`;
  
  const title = `${asset.title} by ${asset.company} - B2B Design Stash`;
  const description = `${asset.category} design by ${asset.company}. ${asset.tags.join(', ')}. Real B2B design inspiration curated by Design Buffs.`;
  
  return {
    title,
    description,
    keywords: [
      asset.title,
      asset.company,
      asset.category,
      ...asset.tags,
      ...asset.design_style,
      'B2B design',
      'design inspiration',
    ],
    authors: [{ name: 'Design Buffs', url: 'https://designbuffs.com' }],
    creator: asset.made_by_db ? 'Design Buffs' : asset.added_by,
    openGraph: {
      title,
      description,
      url: pageUrl,
      siteName: 'B2B Design Stash',
      images: [
        {
          url: asset.file_url,
          width: 1200,
          height: 630,
          alt: `${asset.title} - ${asset.category} design by ${asset.company}`,
        }
      ],
      type: 'article',
      publishedTime: asset.created_at,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [asset.file_url],
      creator: asset.made_by_db ? '@designbuffs' : undefined,
    },
    alternates: {
      canonical: pageUrl,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export default async function DesignPage({ params }: DesignPageProps) {
  const { slug } = await params;
  const asset = await nocoDBService.getAssetBySlug(slug);

  if (!asset) {
    notFound();
  }

  // TODO: Implement actual fetching for navigation and recommendations
  // For now, we'll pass empty/null values since the component handles them gracefully
  const prevSwipe = null; // TODO: Fetch previous swipe in the same category
  const nextSwipe = null; // TODO: Fetch next swipe in the same category
  
  // Fetch recommendations from the same category
  let recommendations: typeof asset[] = [];
  try {
    const categoryRecommendations = await nocoDBService.getAssets({
      category: asset.category,
    });
    // Filter out current asset and limit to 4 recommendations
    recommendations = categoryRecommendations
      .filter(rec => rec.id !== asset.id)
      .slice(0, 4);
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    recommendations = [];
  }

  return (
    <>
      <DesignStructuredData asset={asset} />
      <ViewTracker assetId={asset.id} />
      <DesignPageComponent 
        asset={asset} 
        prevSwipe={prevSwipe}
        nextSwipe={nextSwipe}
        recommendations={recommendations}
      />
    </>
  );
}

// Enable ISR with 1 hour revalidation
export const revalidate = 3600;

// Enable dynamic route generation for pages not pre-generated
export const dynamicParams = true;