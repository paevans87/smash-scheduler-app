# SmashScheduler - AI Agent Reference

## Project Overview
Badminton club session scheduling app built with Next.js 15+, Supabase, and shadcn/ui.

## Core Constraints
- **UK English spelling** (optimise, colour, centre)
- **No code comments** - self-documenting code with SOLID principles
- **Always run tests** after changes
- **Server Components by default** - "use client" only when needed
- **Always commit and push** when work is complete

## Supabase Clients

| Context | Import | Usage |
|---------|--------|-------|
| Server (RSC/Route Handlers) | `@/lib/supabase/server` | `const supabase = await createClient()` |
| Client (Components/Hooks) | `@/lib/supabase/client` | `const supabase = createClient()` |
| Service Role (Admin/Webhooks) | `@/lib/supabase/server` | `createServiceClient()` - bypasses RLS |

**Important**: Always use `getUser()` not `getSession()` - validates JWT server-side.

## Auth Flow
1. Login at `/login` → auth callback → `/clubs` (club selection)
2. Protected routes in `(protected)/` check:
   - Authentication via `supabase.auth.getUser()`
   - Club membership via `club_organisers` table
   - Active subscription via `subscriptions` table
3. Auth gates in `src/lib/auth/gates.ts`

## Route Structure

```
/                           Landing page
/login                      Authentication
/pricing                    Plan selection (Free/Pro/Trial)
/onboarding                 Post-login welcome
/clubs                      Club selection (must have club)
/clubs/[clubSlug]           Club dashboard
/clubs/[clubSlug]/sessions           Session list
/clubs/[clubSlug]/sessions/new       Create new session
/clubs/[clubSlug]/sessions/[id]/draft    Edit draft
/clubs/[clubSlug]/players            Player list
/clubs/[clubSlug]/players/new        Add player
/clubs/[clubSlug]/manage             Club settings + match profiles
```

## Database Schema

### Core Tables
- **clubs**: `id, name, slug (unique), default_court_count, game_type (0=singles,1=doubles)`
- **players**: `id, club_id, name, skill_level (1-10), gender, play_style_preference, is_archived`
- **sessions**: `id, club_id, slug, scheduled_date_time, court_count, state (0=draft,1=active,2=complete)`
- **session_players**: `session_id, player_id, is_active` (compound key)
- **match_making_profiles**: Algorithm configs with weights (skill_balance, time_off_court, match_history)
- **subscriptions**: `club_id, plan_type ('free'|'pro'), status ('active'|'trialling'|'cancelled')`
- **club_organisers**: `club_id, user_id` - many-to-many membership

### RLS Pattern
All tables use RLS with club_organisers check:
```sql
USING (club_id IN (SELECT club_id FROM club_organisers WHERE user_id = auth.uid()))
```

## Paywall Restrictions (Free vs Pro)

| Feature | Free | Pro |
|---------|------|-----|
| Clubs | 1 max | Unlimited |
| Players | 16 max | Unlimited |
| Session Scheduling | 7 days advance | Unlimited |
| Sessions Retained | 3 | Unlimited |
| Organisers | Not allowed | Allowed |
| Matchmaking Profiles | Defaults only | Custom + Simulator |
| Guest Players | ❌ | ✅ |
| CSV Export | ❌ | ✅ |
| Analytics | Minimal | Advanced |
| Branding | ❌ | Logo + Colours |

**Implementation**: Check `src/lib/subscription/restrictions.ts`

## Component Patterns

### Server Component (Default)
```typescript
export default async function Page({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from("table").select();
  return <ClientComponent initialData={data} />;
}
```

### Client Component
```typescript
"use client";
export default function ClientComponent({ initialData }) {
  const [data, setData] = useState(initialData);
  // ... interactive code
}
```

### Form Pattern
```typescript
const [value, setValue] = useState("");
const [isLoading, setIsLoading] = useState(false);
const isValid = value.trim() !== "";

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!isValid) return;
  setIsLoading(true);
  try {
    await saveData();
    router.push("/success");
  } finally {
    setIsLoading(false);
  }
}
```

## UI Components (shadcn/ui)

Located in `src/components/ui/`:
- `button` - Button variants (default, outline, ghost)
- `card` - Card container
- `input` - Text input
- `label` - Form labels
- `badge` - Status badges
- `dialog` - Modal dialogs
- `select`, `checkbox`, `slider`, `switch` - Form controls
- `tooltip`, `popover`, `dropdown-menu` - Overlays

### Styling
- **Tailwind v4** - CSS variables in `globals.css`
- **NEVER** put `--spacing-*`, `--shadow-*`, or `--transition-*` in `@theme inline`
- Use standard utilities: `gap-4`, `p-6`, `text-muted-foreground`
- **No arbitrary values**: Use `w-24` not `w-[100px]`

## Common Pitfalls

| ❌ Don't | ✅ Do |
|----------|-------|
| `getSession()` | `getUser()` |
| `setState` directly in useEffect | Wrap in async function |
| No cleanup in useEffect | Return cleanup function |
| Relative time in SSR | Use "use client" or `suppressHydrationWarning` |
| Access data without loading check | Check `isLoading` first |
| Mutate props directly | Create new state from props |
| Forget await on async | Always await save operations |
| Add code comments | Self-documenting code |

## Testing

```bash
npm run dev      # Dev server
npm run build    # Production build
npm run test     # Vitest tests
npm run lint     # ESLint
```

## Key Files Reference

| Purpose | File |
|---------|------|
| Auth gates | `src/lib/auth/gates.ts` |
| Subscription checks | `src/lib/subscription/restrictions.ts` |
| Server Supabase client | `src/lib/supabase/server.ts` |
| Browser Supabase client | `src/lib/supabase/client.ts` |
| Side navigation | `src/components/side-nav.tsx` |
| Protected layout | `src/app/(protected)/layout.tsx` |
| Club layout | `src/app/(protected)/clubs/[clubSlug]/layout.tsx` |
| Middleware | `src/middleware.ts` |

## Common Tasks

### Add paywall restriction
1. Add to `src/lib/subscription/restrictions.ts`
2. Import helper in page/component
3. Gate UI or block action
4. Show upgrade prompt if restricted

### Create new protected page
1. Create in `src/app/(protected)/clubs/[clubSlug]/...`
2. Check auth + membership in server component
3. Fetch subscription to check plan type
4. Gate features based on plan

---
*Last updated: 2026-02-15*
