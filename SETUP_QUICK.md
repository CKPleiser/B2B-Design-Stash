# Quick Setup Guide

## Skip Supabase for now (Build without Auth)

The app will build and run without Supabase - the paywall features just won't work until you set it up.

### 1. Install Dependencies

```bash
npm install
```

### 2. Create Basic Environment File

```bash
cp .env.local.example .env.local
```

The app will work with the placeholder values for building/development.

### 3. Run Development Server

```bash
npm run dev
```

### 4. Build (Should work now)

```bash
npm run build
```

## When ready to set up authentication:

### Get Supabase Keys (5 minutes)

1. **Go to [supabase.com](https://supabase.com)**
2. **Sign up/Sign in** (free account)
3. **Create new project**
   - Choose any name (e.g., "design-stash")
   - Choose region closest to you
   - Wait 2-3 minutes for setup
4. **Get your keys**:
   - Go to Settings → API (left sidebar)
   - Copy the **Project URL** 
   - Copy the **anon public** key
5. **Update .env.local**:
   ```bash
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   ```

6. **Set up database** (copy/paste this into Supabase SQL Editor):
   ```sql
   -- Copy contents from supabase/migrations/001_initial_schema.sql
   ```

That's it! The paywall will now work.

## Optional: Set up OAuth providers

- **Google**: Follow [Google OAuth setup](https://console.cloud.google.com)
- **LinkedIn**: Follow [LinkedIn Developer setup](https://developer.linkedin.com)

See `docs/supabase-setup.md` for detailed OAuth setup.