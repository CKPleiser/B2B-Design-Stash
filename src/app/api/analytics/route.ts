/**
 * Analytics API endpoint for batch event processing
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { EventName, EventProps } from '@/lib/analytics';

interface AnalyticsEvent {
  name: EventName;
  props: EventProps;
}

interface AnalyticsRequest {
  events: AnalyticsEvent[];
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as AnalyticsRequest;
    
    if (!body.events || !Array.isArray(body.events) || body.events.length === 0) {
      return NextResponse.json({ error: 'No events provided' }, { status: 400 });
    }

    // Limit batch size
    if (body.events.length > 100) {
      return NextResponse.json({ error: 'Too many events in batch' }, { status: 400 });
    }

    // Get auth token from request if present
    const authHeader = request.headers.get('authorization');
    const accessToken = authHeader?.replace('Bearer ', '');
    
    // Create Supabase client (will use service role for anonymous events)
    const supabase = createServerClient(accessToken);
    
    // Get user ID if authenticated
    let userId: string | null = null;
    if (accessToken) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        userId = user?.id || null;
      } catch {
        // Ignore auth errors for anonymous events
      }
    }

    // Prepare records for insertion
    const records = body.events.map(event => ({
      name: event.name,
      props: event.props || {},
      user_id: userId,
      created_at: new Date().toISOString(),
    }));

    // Insert into Supabase events table
    const { error } = await supabase
      .from('events')
      .insert(records);

    if (error) {
      console.error('Supabase events insert error:', error);
      return NextResponse.json({ error: 'Failed to save events' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      count: records.length 
    });

  } catch (error) {
    console.error('Analytics API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' }, 
      { status: 500 }
    );
  }
}

// Handle preflight requests
export async function OPTIONS() {
  return NextResponse.json({}, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}