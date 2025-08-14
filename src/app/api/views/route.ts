import { NextRequest, NextResponse } from 'next/server';
import { nocoDBService } from '@/lib/nocodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { assetId } = body;
    
    console.log('View tracking request received for asset:', assetId);
    
    if (!assetId) {
      console.error('No asset ID provided in request');
      return NextResponse.json(
        { error: 'Asset ID is required' },
        { status: 400 }
      );
    }

    const success = await nocoDBService.incrementViewCount(assetId);
    
    if (success) {
      console.log('Successfully incremented view count for asset:', assetId);
      return NextResponse.json({ success: true });
    } else {
      console.error('Failed to increment view count in NocoDB for asset:', assetId);
      return NextResponse.json(
        { error: 'Failed to increment view count in database' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in /api/views:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Internal server error', details: errorMessage },
      { status: 500 }
    );
  }
}