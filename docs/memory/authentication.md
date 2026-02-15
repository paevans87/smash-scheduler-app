# Authentication & Authorization

## Supabase Setup

Three different clients depending on context:

### 1. Server Client (RSC/Route Handlers)
```typescript
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient(); // Async!
```
- Cookie-based session
- Must be awaited
- Use in: Server Components, Route Handlers, Server Actions

### 2. Browser Client (Client Components)
```typescript
import { createClient } from "@/lib/supabase/client";
const supabase = createClient(); // Sync
```
- Synchronous
- Use in: Client Components, Hooks

### 3. Service Role Client (Admin/Webhooks)
```typescript
import { createServiceClient } from "@/lib/supabase/server";
const supabase = createServiceClient();
```
- Bypasses RLS
- Only for server-side admin operations
- Never expose to client!

## Auth Flow

### Login → Club Selection
1. User logs in at `/login`
2. Auth callback at `/auth/callback` handles session
3. Redirects to `/clubs` (club selection)
4. User selects or creates a club
5. Redirected to `/clubs/[clubSlug]` (dashboard)

### Protected Routes
Route group `(protected)/` has layout that:
1. Checks authentication via `supabase.auth.getUser()`
2. Validates club association via `club_organisers` table
3. Validates active subscription
4. Resolves club by slug param

## Auth Gates

File: `src/lib/auth/gates.ts`

### checkAssociationGate()
Returns array of club IDs the user belongs to.

### checkSubscriptionGate(clubIds)
Throws if none of the clubs have active/trialling subscription.
Redirects to `/pricing` if on free plan with expired trial.

## Middleware

`src/middleware.ts`:
- Refreshes session automatically
- Handles token refresh
- Runs on every request
- Excludes: `_next/`, `api/`, `favicon.ico`, static files

## Row Level Security (RLS)

All tables have RLS enabled. Pattern:

```sql
CREATE POLICY table_policy ON table_name
    FOR ALL
    TO authenticated
    USING (club_id IN (
        SELECT club_id FROM club_organisers WHERE user_id = auth.uid()
    ))
    WITH CHECK (club_id IN (
        SELECT club_id FROM club_organisers WHERE user_id = auth.uid()
    ));
```

## Checking Auth in Components

### Server Component
```typescript
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect("/login");
  }
  
  // Check membership
  const { data: membership } = await supabase
    .from("club_organisers")
    .select("club_id")
    .eq("club_id", clubId)
    .eq("user_id", user.id)
    .single();
    
  if (!membership) {
    redirect("/clubs");
  }
}
```

### Client Component
```typescript
"use client";
import { useEffect } from "react";

export default function Component() {
  const supabase = createClient();
  
  useEffect(() => {
    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
      }
    }
    checkAuth();
  }, []);
}
```

## Sign Out

Route: `/logout`
Method: POST
Action: Clears session, redirects to `/login`

## Important Rules

1. **Always use `getUser()` not `getSession()`**
   - `getUser()` validates JWT server-side
   - `getSession()` reads from localStorage (can be spoofed)

2. **Never trust client-side auth alone**
   - Always re-check on server
   - RLS is the final authority

3. **Club slug in URL**
   - Always resolve club by slug, not ID
   - Slug is human-readable and shareable
   - Format: `my-club-name-1` (kebab-case with suffix if duplicate)

4. **Subscription state**
   - Must check `subscriptions.status` IN ('active', 'trialling')
   - Free plan has no subscription row OR status='trialling' after trial

## Stripe Integration

Subscription flow:
1. User selects Pro plan at `/pricing`
2. Stripe Checkout session created via `/api/checkout`
3. User pays on Stripe
4. Webhook at `/api/webhook/stripe` receives events
5. Fulfilment at `/api/checkout/fulfil` creates club + subscription
6. Redirects to `/checkout/pending` then `/clubs/[slug]`

## Common Auth Patterns

### Get Current User
```typescript
const { data: { user } } = await supabase.auth.getUser();
```

### Get User's Clubs
```typescript
const { data } = await supabase
  .from("club_organisers")
  .select("club_id, clubs(id, name, slug)")
  .eq("user_id", user.id);
```

### Check Subscription
```typescript
const { data } = await supabase
  .from("subscriptions")
  .select("status")
  .eq("club_id", clubId)
  .in("status", ["active", "trialling"])
  .single();
```
