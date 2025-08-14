# Fix Supabase Authentication - Quick Guide

## The Problem
Your magic links are creating users but failing on callback with "access denied" because the redirect URL isn't configured in Supabase.

## The Solution (2 minutes)

### Step 1: Configure Redirect URLs in Supabase
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/omcyckbwmmgxmbrrdkyf
2. Navigate to **Authentication** → **URL Configuration**
3. Add these URLs to **Redirect URLs** (one per line):
   ```
   http://localhost:3000/auth/callback
   http://localhost:3001/auth/callback
   http://localhost:3002/auth/callback
   http://localhost:3003/auth/callback
   ```
4. Click **Save**

### Step 2: Configure OAuth Providers (if not done)
1. Still in **Authentication** section
2. Go to **Providers**
3. Enable **Google**:
   - Get OAuth credentials from Google Cloud Console
   - Add redirect URL: `https://omcyckbwmmgxmbrrdkyf.supabase.co/auth/v1/callback`
4. Enable **LinkedIn**:
   - Get OAuth credentials from LinkedIn Developer Portal
   - Add redirect URL: `https://omcyckbwmmgxmbrrdkyf.supabase.co/auth/v1/callback`

### Step 3: Test Authentication
1. Start your dev server: `npm run dev`
2. Open http://localhost:3000
3. Click on any design to trigger the paywall
4. Try "Continue with Email"
5. Check your email and click the magic link
6. You should be redirected back and authenticated!

## Current Status
✅ Users are being created in the database
✅ Magic links are being sent
❌ Callback redirect is failing (this guide fixes it)

## After This Fix Works
The authentication flow will complete successfully and users will be able to access the full stash!