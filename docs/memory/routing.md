# Routing & URLs

## URL Structure

```
/                           Landing page
/login                      Authentication
/pricing                    Plan selection & checkout
/onboarding                 Post-login welcome
/checkout/pending           Stripe checkout completion

/clubs                      Club selection (must have 1+ clubs)
/clubs/[clubSlug]           Club dashboard
/clubs/[clubSlug]/sessions           Session list
/clubs/[clubSlug]/sessions/new       Create new session
/clubs/[clubSlug]/sessions/[id]/draft    Edit draft session
/clubs/[clubSlug]/sessions/[id]/active   Active session
/clubs/[clubSlug]/sessions/[id]/complete Finished session
/clubs/[clubSlug]/players              Player list
/clubs/[clubSlug]/players/new          Add player
/clubs/[clubSlug]/players/[id]/edit    Edit player
/clubs/[clubSlug]/manage               Club settings
/clubs/[clubSlug]/manage/profiles/new  New match profile
/clubs/[clubSlug]/manage/profiles/[id]  Edit match profile
```

## Route Groups

### (protected)/
Everything in this folder requires authentication.

Layout does:
1. Check auth
2. Check club membership
3. Check subscription
4. Render side-nav + content

### (auth)/
Not used currently - auth pages are at root level.

## Dynamic Segments

### [clubSlug]
Human-readable club identifier.
- Format: `my-club-name` or `my-club-name-2` (if duplicate)
- Generated from club name automatically
- Used in URL instead of UUID for shareability
- Resolved to club_id in layouts/pages

### [sessionId]
UUID of session.
- Used in session-specific pages
- Combined with state: `/sessions/[id]/draft`

### [profileId]
UUID of match making profile.
- Used in profile edit pages

## Route Conventions

### Page Files
- `page.tsx` - Main page component (Server Component by default)
- `layout.tsx` - Shared layout for route segment
- `loading.tsx` - Loading UI (suspense fallback)
- `error.tsx` - Error boundary
- `not-found.tsx` - 404 page
- `route.ts` - API route handler

### Layout Pattern
```typescript
// layout.tsx in (protected)/clubs/[clubSlug]/
export default async function ClubLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clubSlug: string }>;
}) {
  const { clubSlug } = await params;
  
  // 1. Check auth
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  
  // 2. Resolve club
  const { data: club } = await supabase
    .from("clubs")
    .select("id, name")
    .eq("slug", clubSlug)
    .single();
  if (!club) redirect("/clubs");
  
  // 3. Check membership
  const { data: membership } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("club_id", club.id)
    .eq("user_id", user.id)
    .single();
  if (!membership) redirect("/clubs");
  
  // 4. Get user for side-nav
  const { data: { user: userData } } = await supabase.auth.getUser();
  
  return (
    <div className="flex h-screen">
      <SideNav 
        clubSlug={clubSlug} 
        clubName={club.name}
        userEmail={userData?.email || ""}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
```

### Parallel Routes
Not currently used, but could be implemented for:
- Side panel previews
- Modal overlays
- Split views

## Navigation

### Programmatic Navigation
```typescript
import { useRouter } from "next/navigation";

const router = useRouter();

// Navigate
router.push("/clubs/my-club/sessions");

// Refresh current route (re-fetch data)
router.refresh();

// Go back
router.back();
```

### Link Component
```typescript
import Link from "next/link";

<Link href={`/clubs/${clubSlug}/sessions`}>
  View Sessions
</Link>
```

### Active Link Styling
Use `usePathname()` from "next/navigation":
```typescript
const pathname = usePathname();
const isActive = pathname === `/clubs/${clubSlug}/sessions`;
```

## API Routes

### Creating API Routes
File: `app/api/my-route/route.ts`

```typescript
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json();
  
  // Do something
  
  return NextResponse.json({ success: true });
}
```

### Current API Routes
- `POST /api/checkout` - Create Stripe checkout session
- `POST /api/checkout/trial` - Start Pro trial
- `POST /api/checkout/fulfil` - Complete checkout (webhook)
- `POST /api/webhook/stripe` - Stripe webhook handler

## Route Guards

### Authentication Guard
All routes in `(protected)/` check auth in layout.

### Subscription Guard
Subscription check happens in `src/lib/auth/gates.ts`:
```typescript
await checkSubscriptionGate([clubId]);
```

Redirects to `/pricing` if no active subscription.

### Club Membership Guard
Check if user is organiser of club:
```typescript
const { data } = await supabase
  .from("club_organisers")
  .select("club_id")
  .eq("club_id", clubId)
  .eq("user_id", user.id)
  .single();

if (!data) redirect("/clubs");
```

## Query Parameters

### Reading Query Params
Server Component:
```typescript
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { session_id } = await searchParams;
}
```

Client Component:
```typescript
import { useSearchParams } from "next/navigation";

const searchParams = useSearchParams();
const sessionId = searchParams.get("session_id");
```

## Rewrites & Redirects

### Middleware Redirects
In `src/middleware.ts`:
```typescript
if (!user && !request.nextUrl.pathname.startsWith("/login")) {
  return NextResponse.redirect(new URL("/login", request.url));
}
```

### Not Found
```typescript
import { notFound } from "next/navigation";

if (!data) {
  notFound(); // Renders not-found.tsx
}
```

## URL Best Practices

1. **Use slugs not IDs in URLs** - Better for SEO and sharing
2. **RESTful structure** - `/resource/action` or `/resource/id`
3. **Kebab-case** - `/match-making-profiles` not `/matchMakingProfiles`
4. **Consistent state naming** - `draft`, `active`, `complete` for sessions
5. **No trailing slashes** - Next.js handles this automatically
