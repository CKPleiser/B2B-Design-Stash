/**
 * Next.js middleware for session handling and gate overrides
 */
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function middleware(request: NextRequest) {
  const response = NextResponse.next();
  
  // Skip middleware for static files and API routes (except auth)
  if (
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/favicon') ||
    request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/api/auth')
  ) {
    return response;
  }

  try {
    // Create Supabase client for server-side auth check
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Missing Supabase configuration in middleware');
      return response;
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Get session from request cookies
    let session = null;
    const accessToken = request.cookies.get('sb-access-token')?.value;
    
    if (accessToken) {
      try {
        const { data: { user } } = await supabase.auth.getUser(accessToken);
        if (user) {
          session = { user };
        }
      } catch (error) {
        console.debug('Session validation failed:', error);
      }
    }

    // Set user header for downstream use
    if (session?.user) {
      response.headers.set('x-user-id', session.user.id);
      response.headers.set('x-user-authenticated', 'true');
    } else {
      response.headers.set('x-user-authenticated', 'false');
    }

    // Handle gate override for internal previews
    const gateOverride = request.cookies.get('gate')?.value;
    if (gateOverride === 'off') {
      response.headers.set('x-gate-override', 'true');
    }

    // Set cache control headers for gated content
    if (!session?.user && request.nextUrl.pathname !== '/') {
      // Don't cache pages for unauthenticated users to prevent serving gated content
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      response.headers.set('Pragma', 'no-cache');
      response.headers.set('Expires', '0');
    }

  } catch (error) {
    console.error('Middleware error:', error);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};