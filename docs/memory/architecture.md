# Architecture Overview

## Tech Stack
- **Framework**: Next.js 15+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui + Radix UI primitives
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **Offline**: IndexedDB via idb library
- **Icons**: Lucide React

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (protected)/             # Route group - requires auth
│   │   ├── clubs/
│   │   │   ├── [clubSlug]/      # Club-scoped pages
│   │   │   │   ├── sessions/    # Session management
│   │   │   │   ├── players/     # Player management
│   │   │   │   ├── manage/      # Club settings & match profiles
│   │   │   │   └── layout.tsx   # Club layout with side-nav
│   │   │   └── page.tsx         # Club selection page
│   │   └── layout.tsx           # Protected layout with auth gates
│   ├── api/                     # API routes (Stripe webhooks, etc.)
│   ├── auth/                    # Auth callback
│   ├── globals.css              # Tailwind imports
│   └── layout.tsx               # Root layout with metadata
├── components/
│   ├── ui/                      # shadcn/ui components
│   ├── side-nav.tsx             # Main navigation
│   ├── profile-menu.tsx         # User menu
│   └── offline-indicator.tsx    # Offline status
├── lib/
│   ├── offline/                 # Offline sync system
│   │   ├── db.ts               # IndexedDB schema
│   │   ├── sync-service.ts     # Data sync functions
│   │   ├── sync-reconciler.ts  # Pending changes sync
│   │   ├── pending-changes.ts  # Queue management
│   │   ├── use-sessions.ts     # Offline-first hooks
│   │   ├── use-players.ts      # Offline-first hooks
│   │   └── online-status-provider.tsx
│   ├── supabase/
│   │   ├── server.ts           # Server client (async, cookie-based)
│   │   ├── client.ts           # Browser client (sync)
│   │   └── middleware.ts       # Session refresh
│   ├── auth/
│   │   └── gates.ts            # Association/subscription checks
│   └── utils.ts                # cn() utility
└── middleware.ts               # Auth middleware
```

## Server vs Client Components

### Server Components (Default)
- Data fetching with `createClient()` from `@/lib/supabase/server`
- Async/await pattern
- Access to headers/cookies
- Used for: Page shells, static content, initial data loads

### Client Components
- Mark with `"use client"`
- Use `createClient()` from `@/lib/supabase/client` (sync)
- Interactivity required
- Used for: Forms, real-time updates, offline functionality

## Key Patterns

### Auth Pattern
```typescript
// Server
const supabase = await createClient();
const { data: { user } } = await supabase.auth.getUser();
if (!user) redirect("/login");

// Client
const supabase = createClient();
const { data: { user } } = await supabase.auth.getUser();
```

### Offline-First Data Loading
```typescript
const { data, isLoading, isStale, mutate } = useSessions(clubId);
// Online: Fetches from API, caches to IndexedDB
// Offline: Reads from IndexedDB cache
```

### Protected Routes
Protected routes are in `(protected)/` route group which:
1. Checks user authentication
2. Validates club association
3. Validates active subscription
4. Resolves club by slug

## Route Conventions

- `/clubs` - Club selection page
- `/clubs/[clubSlug]` - Club dashboard
- `/clubs/[clubSlug]/sessions` - Session list
- `/clubs/[clubSlug]/sessions/new` - Create session
- `/clubs/[clubSlug]/sessions/[sessionId]/draft` - Edit draft session
- `/clubs/[clubSlug]/players` - Player list
- `/clubs/[clubSlug]/manage` - Club settings & match profiles
