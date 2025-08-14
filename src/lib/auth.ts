/**
 * Authentication utilities and functions
 */
import { supabase } from './supabase/client';

export type AuthProvider = 'google' | 'linkedin_oidc';

/**
 * Sign in with OAuth provider
 */
export async function signInWithProvider(provider: AuthProvider) {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `http://localhost:3000/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      console.error(`Error signing in with ${provider}:`, error);
      throw new Error(`Failed to sign in with ${provider}: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error(`Sign in error:`, error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown authentication error')
    };
  }
}

/**
 * Sign in with email magic link
 */
export async function signInWithEmail(email: string) {
  try {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `http://localhost:3000/auth/callback`,
      },
    });

    if (error) {
      console.error('Error signing in with email:', error);
      throw new Error(`Failed to send magic link: ${error.message}`);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Email sign in error:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error : new Error('Unknown authentication error')
    };
  }
}

/**
 * Sign out user
 */
export async function signOut() {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Error signing out:', error);
      throw new Error(`Failed to sign out: ${error.message}`);
    }

    // Clear any client-side storage
    if (typeof window !== 'undefined') {
      localStorage.removeItem('db_stash_gate_v1');
    }
    
    return { error: null };
  } catch (error) {
    console.error('Sign out error:', error);
    return { 
      error: error instanceof Error ? error : new Error('Unknown sign out error')
    };
  }
}

/**
 * Get current user session
 */
export async function getSession() {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('Error getting session:', error);
      return { session: null, error };
    }

    return { session, error: null };
  } catch (error) {
    console.error('Session error:', error);
    return { 
      session: null, 
      error: error instanceof Error ? error : new Error('Unknown session error')
    };
  }
}

/**
 * Get current user
 */
export async function getUser() {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      // Don't log AuthSessionMissingError as it's expected when not logged in
      if (error.message !== 'Auth session missing!') {
        console.error('Error getting user:', error);
      }
      return { user: null, error };
    }

    return { user, error: null };
  } catch (error) {
    // Don't log session missing errors as they're expected
    const errorMsg = error instanceof Error ? error.message : 'Unknown user error';
    if (errorMsg !== 'Auth session missing!') {
      console.error('User error:', error);
    }
    return { 
      user: null, 
      error: error instanceof Error ? error : new Error('Unknown user error')
    };
  }
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const { session } = await getSession();
  return !!session;
}