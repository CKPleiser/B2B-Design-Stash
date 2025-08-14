# Paywall Gate System Documentation

This document explains how the soft paywall system works and how to configure it.

## Overview

The gate system implements a soft paywall that limits content access for anonymous users while allowing full access after authentication. It's designed to be non-intrusive and respect user experience while encouraging sign-ups.

## How It Works

### Gate Modes

The system supports two gating modes, controlled by the `GATE_MODE` environment variable:

#### List Mode (`GATE_MODE=list`)
- Shows a percentage of items in list views to anonymous users
- Remaining items are blurred with unlock CTAs
- Controlled by `GATE_QUOTA_LIST` (default: 0.4 = 40%)

#### Detail Mode (`GATE_MODE=detail`) 
- Allows anonymous users to view a limited number of detail pages per session
- After the limit, shows paywall modal before page content
- Controlled by `GATE_QUOTA_DETAIL` (default: 3 pages)

### Storage and Reset

- Uses localStorage with key `db_stash_gate_v1`
- Counters reset daily at 00:00 local time
- Includes suppression mechanism to prevent modal spam

### Storage Schema

```typescript
interface GateStorage {
  listSeen: number;        // Number of list views recorded
  detailSeen: number;      // Number of detail pages viewed  
  lastReset: string;       // ISO string of last reset time
  suppressUntil?: string;  // ISO string to suppress modal until this time
}
```

## Configuration

### Environment Variables

```bash
# Gate configuration
GATE_QUOTA_LIST=0.4          # 40% of list items shown to anonymous users
GATE_QUOTA_DETAIL=3          # 3 detail pages allowed per session
GATE_MODE=list               # "list" or "detail" mode

# Required for paywall functionality
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### Changing Quotas

1. **List Quota**: Adjust `GATE_QUOTA_LIST` (0.0 to 1.0)
   - 0.3 = 30% of items shown
   - 0.5 = 50% of items shown
   - 1.0 = all items shown (effectively disables list gating)

2. **Detail Quota**: Adjust `GATE_QUOTA_DETAIL` (integer)
   - 1 = only 1 detail page allowed
   - 5 = 5 detail pages allowed
   - 0 = immediate gating (not recommended for UX)

### Switching Modes

Change `GATE_MODE` environment variable:
- `list`: Gate based on percentage of list items
- `detail`: Gate based on number of detail page views

## Customization

### Modal Copy

Edit the PaywallModal component (`src/components/PaywallModal.tsx`):

```typescript
// Change modal title
<h2>Your Custom Title</h2>

// Change modal description  
<p>Your custom description text.</p>

// Change social proof text
<p>Join X,XXX+ users using Your App</p>
```

### Button Styling

The modal uses your existing button variants. To customize:

1. **Colors**: Update CSS custom properties in `globals.css`
2. **Button variants**: Modify `src/components/ui/button.tsx`
3. **Modal styles**: Edit `src/components/PaywallModal.tsx`

### Gate Behavior

Customize gate logic in `src/lib/gate.ts`:

```typescript
// Change bot detection patterns
const botPatterns = ['bot', 'crawler', 'your-pattern'];

// Modify reset timing (currently daily at midnight)
const resetTime = new Date(now);
resetTime.setHours(0, 0, 0, 0);

// Adjust suppression duration (default: 30 minutes)
suppress(30 * 60 * 1000);
```

## Internal Previews

For internal team access without gating, set a cookie:

```javascript
// In browser console or via server
document.cookie = "gate=off; path=/";
```

This bypasses all gating checks. Useful for:
- Internal team reviews
- Demo purposes  
- Testing without auth

## Analytics

The system tracks these events to your Supabase `events` table:

- `stash_view`: When content is viewed
- `gate_impression`: When paywall is shown
- `gate_block`: When user hits quota limit
- `auth_start`: When user starts authentication
- `auth_success`: When authentication succeeds

### Event Properties

```typescript
// Example gate_block event
{
  name: "gate_block",
  props: {
    quota: 3,
    counts: { listSeen: 5, detailSeen: 3 },
    source: "detail"
  },
  user_id: null, // null for anonymous
  created_at: "2024-01-15T10:30:00Z"
}
```

## Testing

### Manual Testing

1. **Clear storage**: `localStorage.removeItem('db_stash_gate_v1')`
2. **Check current state**: `gate.getCounts()`
3. **Reset counters**: `gate.reset()`
4. **Force modal**: `gate.suppress(0)` then trigger action

### Test Scenarios

1. **List Mode Testing**:
   - Load page, verify correct number of visible items
   - Check blurred items have unlock CTAs
   - Click blurred item, verify modal shows

2. **Detail Mode Testing**:
   - Visit detail pages up to quota
   - Next detail page should show paywall modal
   - Sign in should unlock access

3. **Reset Testing**:
   - Set `lastReset` to yesterday
   - Reload page, verify counters reset

## Troubleshooting

### Modal Not Showing

1. Check browser console for errors
2. Verify environment variables are set
3. Check if bot detection is triggering
4. Ensure `isAuthenticated` is false

### Counters Not Resetting  

1. Check localStorage data format
2. Verify date parsing in `getStorage()`
3. Check timezone handling

### Authentication Issues

1. Verify Supabase configuration
2. Check auth callback URL setup
3. Test OAuth provider settings

### Performance Issues

1. Check analytics queue size
2. Verify event batching is working
3. Monitor Supabase quota usage

## Best Practices

### UX Guidelines

1. **Graceful degradation**: Always show some content first
2. **Clear value prop**: Explain what users get by signing in  
3. **Multiple entry points**: Provide various ways to unlock
4. **Respect suppression**: Don't spam users with modals

### Technical Guidelines

1. **Error handling**: Gracefully handle storage/network failures
2. **Performance**: Minimize blocking operations
3. **Accessibility**: Ensure keyboard navigation and screen readers work
4. **Analytics**: Track meaningful events for optimization

### Security Considerations

1. **Client-side only**: Gate is UX-level, not security enforcement
2. **Rate limiting**: Prevent abuse of authentication endpoints
3. **Privacy**: Respect user data and consent preferences