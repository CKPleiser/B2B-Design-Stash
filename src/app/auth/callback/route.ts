/**
 * Auth callback handler for OAuth redirects
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const { searchParams, origin, hash } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const error_description = searchParams.get('error_description');
  const next = searchParams.get('next') ?? '/';

  console.log('=== AUTH CALLBACK DEBUG ===');
  console.log('Code:', code ? 'present' : 'missing');
  console.log('Error:', error);
  console.log('Error description:', error_description);
  console.log('Hash:', hash);
  console.log('Full URL:', request.url);
  console.log('Origin:', origin);
  console.log('Next:', next);

  // Handle OAuth errors first
  if (error) {
    console.error('OAuth error in callback:', { error, error_description });
    return NextResponse.redirect(`${origin}/auth/error?error=${error}&description=${encodeURIComponent(error_description || '')}`);
  }

  // For magic links, the tokens come in the URL fragment, not as query params
  // We need to handle this on the client side since the server can't access the fragment
  // Let's redirect to a client-side handler for magic link flows
  if (!code) {
    console.log('No code found - likely magic link with tokens in fragment. Redirecting to client handler.');
    return NextResponse.redirect(`${origin}/auth/callback-client`);
  }

  if (code) {
    // Use hardcoded values that we know work
    const supabase = createClient(
      'https://omcyckbwmmgxmbrrdkyf.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9tY3lja2J3bW1neG1icnJka3lmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUxNjU4NTEsImV4cCI6MjA3MDc0MTg1MX0.ioeoj2NcCe9XpbyGPrNWlpt8TKyO21YxYJNZBUQNk_M',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    try {
      const { data: { session }, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Auth callback error:', error);
        return NextResponse.redirect(`${origin}/auth/error?error=callback_failed`);
      }

      if (session) {
        console.log('✅ Auth successful! Session created for user:', session.user?.email);
        
        // Create response with redirect to success page
        const response = NextResponse.redirect(`${origin}/auth/success`);
        
        // Set session cookies
        response.cookies.set('sb-access-token', session.access_token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: session.expires_in,
        });

        response.cookies.set('sb-refresh-token', session.refresh_token, {
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        });

        return response;
      }
    } catch (error) {
      console.error('Auth callback exception:', error);
      return NextResponse.redirect(`${origin}/auth/error?error=server_error`);
    }
  }

  // No code parameter, redirect to auth error
  return NextResponse.redirect(`${origin}/auth/error?error=missing_code`);
}