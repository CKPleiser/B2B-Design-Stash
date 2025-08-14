import { NextRequest, NextResponse } from 'next/server';
import { nocoDBService } from '@/lib/nocodb';

export const revalidate = 300; // Revalidate every 5 minutes
export const dynamic = 'force-dynamic'; // Force dynamic for search functionality

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const made_by_db = searchParams.get('made_by_db') === 'true';
  const industry = searchParams.get('industry') || undefined;
  const design_styles = searchParams.get('design_styles')?.split(',') || [];

  try {
    const assets = await nocoDBService.getAssets({
      category,
      search,
      made_by_db: made_by_db || undefined,
      industry: industry,
      design_styles: design_styles.length > 0 ? design_styles : undefined,
    });

    const response = NextResponse.json(assets);
    
    // Add caching headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=300');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=300');
    
    return response;
  } catch (error) {
    console.error('Error in /api/assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500, headers: { 'Cache-Control': 'no-cache' } }
    );
  }
}