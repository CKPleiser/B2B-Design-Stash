import { NextRequest, NextResponse } from 'next/server';
import { nocoDBService } from '@/lib/nocodb';

export const revalidate = 60; // Revalidate every minute to ensure fresh signed URLs
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
    
    // Reduce cache duration to ensure signed URLs don't expire
    response.headers.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=30');
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=60');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=60');
    
    return response;
  } catch (error) {
    console.error('Error in /api/assets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch assets' },
      { status: 500, headers: { 'Cache-Control': 'no-cache' } }
    );
  }
}