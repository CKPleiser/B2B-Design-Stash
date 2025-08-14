# Supabase Setup Guide

This guide walks you through setting up Supabase for the paywall system.

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in and create a new project
3. Choose a region close to your users
4. Wait for project to be created

## 2. Database Setup

### Run SQL Migration

In your Supabase SQL editor, run the migration file:

```sql
-- Copy and paste contents of supabase/migrations/001_initial_schema.sql
```

Or use the Supabase CLI:

```bash
npx supabase db push
```

### Verify Tables

Check that these tables were created:
- `public.profiles`
- `public.events`

## 3. Authentication Setup

### Enable OAuth Providers

#### Google OAuth

1. Go to Authentication → Settings → Auth
2. Find "Google" under OAuth providers
3. Enable Google OAuth
4. Add your OAuth credentials:

**Google Cloud Console Setup:**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create new project or select existing
3. Enable Google+ API
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. Set application type to "Web application"
6. Add authorized redirect URI:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
7. Copy Client ID and Client Secret to Supabase

#### LinkedIn OAuth

1. Go to [LinkedIn Developer Portal](https://developer.linkedin.com)
2. Create new app
3. Add "Sign In with LinkedIn using OpenID Connect" product
4. Set redirect URL:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```
5. Copy Client ID and Client Secret
6. In Supabase, enable "LinkedIn (OIDC)" provider
7. Paste credentials

### Email Magic Links

Email auth is enabled by default. Configure:

1. Go to Authentication → Settings → Auth
2. Scroll to "SMTP Settings"
3. Either use built-in service or configure custom SMTP

## 4. Environment Variables

### Required Variables

Create `.env.local` file in your project root:

```bash
# Supabase Configuration  
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Site Configuration
NEXT_PUBLIC_SITE_URL=https://your-domain.com

# Gate Configuration
GATE_QUOTA_LIST=0.4
GATE_QUOTA_DETAIL=3
GATE_MODE=list
```

### Finding Your Keys

1. Go to your Supabase project dashboard
2. Click "Settings" → "API"
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`  
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY`

## 5. Deploy Configuration

### Vercel Deployment

1. Go to your Vercel dashboard
2. Select your project → Settings → Environment Variables
3. Add all environment variables from `.env.local`
4. Redeploy your application

### Update OAuth Redirect URLs

After deploying, update OAuth providers with production URLs:

**Google:**
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add production redirect URI:
   ```
   https://your-project-id.supabase.co/auth/v1/callback
   ```

**LinkedIn:**  
1. Go to LinkedIn Developer Portal
2. Edit your app settings
3. Update redirect URL to production domain

## 6. Database Policies Verification

Verify Row Level Security (RLS) policies are working:

### Test Profiles Table

```sql
-- Should work (user can see own profile)
SELECT * FROM profiles WHERE id = auth.uid();

-- Should fail (user can't see others' profiles)  
SELECT * FROM profiles WHERE id != auth.uid();
```

### Test Events Table

```sql
-- Should work (anyone can insert events)
INSERT INTO events (name, props) VALUES ('test_event', '{"test": true}');

-- Should fail (cannot select events)
SELECT * FROM events;
```

## 7. Test Authentication Flow

### Test Google OAuth

1. Visit your site
2. Trigger paywall modal  
3. Click "Continue with Google"
4. Complete OAuth flow
5. Verify you're redirected back and logged in
6. Check `profiles` table has new entry

### Test Email Magic Link

1. Trigger paywall modal
2. Enter email address
3. Check email for magic link
4. Click link and verify login

## 8. Analytics Verification

### Check Event Logging

1. Browse your site to trigger events
2. In Supabase, go to Table Editor → events
3. Verify events are being logged:
   - `stash_view` events when viewing content
   - `gate_impression` when paywall shows
   - `auth_start` when starting authentication

### Example Event Query

```sql
-- View recent events
SELECT * FROM events 
ORDER BY created_at DESC 
LIMIT 20;

-- Count events by type
SELECT name, COUNT(*) 
FROM events 
GROUP BY name;
```

## 9. Troubleshooting

### Common Issues

**"Invalid API key"**
- Double-check environment variable names
- Ensure no extra spaces in keys
- Verify keys are from correct project

**OAuth redirect mismatch**
- Ensure redirect URLs match exactly in OAuth providers
- Check for http vs https
- Verify Supabase project URL is correct

**RLS blocking requests**
- Check if policies are applied correctly
- Verify user authentication state
- Test with service role key temporarily

**Events not logging**
- Check browser network tab for 401/403 errors
- Verify RLS policy allows inserts
- Check analytics API endpoint

### Debug Commands

```javascript
// Check auth state
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);

// Check gate state  
console.log('Gate counts:', gate.getCounts());

// Force reset gate
gate.reset();

// Check analytics queue
console.log('Analytics queue length:', analytics.eventQueue.length);
```

## 10. Production Checklist

- [ ] Supabase project created and configured
- [ ] Database migrations applied
- [ ] OAuth providers configured with production URLs
- [ ] Environment variables set in deployment platform
- [ ] RLS policies tested and verified
- [ ] Authentication flows tested end-to-end
- [ ] Analytics events logging correctly
- [ ] Error monitoring set up
- [ ] Backup/monitoring configured in Supabase

## Security Notes

1. **Never expose service role key** in client-side code
2. **Use RLS policies** to secure data access
3. **Validate OAuth redirect URLs** to prevent attacks
4. **Monitor authentication logs** for unusual activity
5. **Set up alerts** for quota usage and errors