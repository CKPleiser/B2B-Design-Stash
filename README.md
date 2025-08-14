# B2B Design Stash with Soft Paywall

A curated gallery of B2B design inspiration with a soft paywall system that encourages user registration. Built for marketers and designers who want to access real work that converts, featuring authentication via Supabase and first-party analytics.

## Features

- **Soft Paywall System**: Non-intrusive gating that shows partial content to anonymous users
- **Multi-Provider Authentication**: Google, LinkedIn OIDC, and email magic links via Supabase
- **First-Party Analytics**: Track user behavior without third-party services
- **Responsive Gallery**: Masonry-style layout that works on all devices
- **Smart Filtering**: Search by keyword, filter by category, toggle Design Buffs portfolio
- **Multi-format Support**: View images and PDFs with embedded preview
- **Submission System**: Community members can submit designs for moderation
- **SEO Optimized**: Meta tags, structured data, and accessibility features
- **Accessibility**: WCAG compliant with focus management and screen reader support

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript and App Router
- **UI Components**: Shadcn/ui + Tailwind CSS + Radix UI
- **Authentication**: Supabase Auth (Google, LinkedIn, Email)
- **Database**: Supabase + NocoDB for content management
- **Analytics**: First-party event tracking to Supabase
- **PDF Viewing**: react-pdf with PDF.js
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- Supabase account
- Google OAuth app (optional)
- LinkedIn OAuth app (optional)

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd b2b-design-stash
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your actual values
   ```

4. Set up Supabase:
   ```bash
   # Follow the guide in docs/supabase-setup.md
   ```

5. Run the development server:
   ```bash
   npm run dev
   ```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

## Configuration

### Paywall Settings

The paywall behavior is controlled by environment variables:

```bash
# Gate mode: "list" or "detail"
GATE_MODE=list

# For list mode: percentage of items shown (0.0-1.0)  
GATE_QUOTA_LIST=0.4

# For detail mode: number of pages allowed
GATE_QUOTA_DETAIL=3
```

### Authentication Providers

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=https://your-domain.com
```

## Architecture

### Core Components

- **Gate SDK** (`src/lib/gate.ts`): Manages quota tracking and paywall logic
- **PaywallModal** (`src/components/PaywallModal.tsx`): Authentication modal
- **Analytics** (`src/lib/analytics.ts`): First-party event tracking
- **Auth System** (`src/lib/auth.ts`): Supabase authentication wrapper

### Data Flow

1. Anonymous user visits site
2. Gate SDK tracks page views in localStorage
3. When quota exceeded, PaywallModal appears
4. User authenticates via chosen provider
5. Full content access granted
6. All interactions tracked to Supabase

## Customization

### Changing Modal Copy

Edit `src/components/PaywallModal.tsx`:

```typescript
<h2>Your Custom Title</h2>
<p>Your custom description text.</p>
```

### Adjusting Gate Behavior

Modify quotas in environment variables or customize logic in `src/lib/gate.ts`.

## Analytics

Events are tracked to your Supabase `events` table:

- `stash_view`: Content viewing
- `gate_impression`: Paywall shown  
- `gate_block`: User hit quota limit
- `auth_start`: Authentication initiated
- `auth_success`: Successful login

## Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Set environment variables in Vercel dashboard
3. Update OAuth redirect URLs with production domain
4. Deploy

### Environment Variables Checklist

- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `NEXT_PUBLIC_SITE_URL`
- [ ] `GATE_MODE`
- [ ] `GATE_QUOTA_LIST` or `GATE_QUOTA_DETAIL`

## Testing

### Manual Testing

1. Clear localStorage: `localStorage.removeItem('db_stash_gate_v1')`
2. Browse site until quota reached
3. Verify paywall appears
4. Test authentication flows
5. Confirm full access after login

## Documentation

- [Paywall System Guide](docs/gate.md)
- [Supabase Setup](docs/supabase-setup.md)

---

**Built with ❤️ by Design Buffs**  
Visual storytelling for brands who mean business.