# Quick Reference for AI Agents

## Project Type
Next.js 15+ web application for badminton club session scheduling with offline support.

## Key Commands
```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run test     # Run tests (Vitest)
npm run lint     # ESLint check
```

## Supabase Client Usage
**Server Component:**
```typescript
import { createClient } from "@/lib/supabase/server";
const supabase = await createClient(); // Async!
```

**Client Component:**
```typescript
import { createClient } from "@/lib/supabase/client";
const supabase = createClient(); // Sync
```

## Database Table -> UI Mapping
| Table | Page | Purpose |
|-------|------|---------|
| clubs | /clubs/[clubSlug] | Club settings |
| players | /clubs/[clubSlug]/players | Player management |
| sessions | /clubs/[clubSlug]/sessions | Session scheduling |
| match_making_profiles | /clubs/[clubSlug]/manage | Match algorithm configs |

## Session States
- `0` = Draft (being configured)
- `1` = Active (ready to play)
- `2` = Complete (finished)

## Game Types
- `0` = Singles (min 2 players)
- `1` = Doubles (min 4 players)

## Offline Support
1. Check `isOnline` from `useOnlineStatus()`
2. Save to Supabase only if online
3. Always cache to IndexedDB
4. Always queue pending change
5. Use `useSessions()` / `usePlayers()` hooks

## Protected Route Requirements
1. User must be logged in (getUser())
2. User must be club organiser (club_organisers table)
3. Club must have active/trialling subscription

## Form Pattern
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
  } catch {
    // Show error
  } finally {
    setIsLoading(false);
  }
}
```

## Component Pattern
```typescript
// Server Component (default)
export default async function Page() {
  const data = await fetchData();
  return <ClientComponent initialData={data} />;
}

// Client Component (when interactive)
"use client";
export default function ClientComponent({ initialData }) {
  const [data, setData] = useState(initialData);
  // ... interactive code
}
```

## Styling Quick Reference
- **Primary button**: `<Button>`
- **Secondary button**: `<Button variant="outline">`
- **Ghost button**: `<Button variant="ghost">`
- **Card**: `<Card><CardHeader><CardTitle>Title</CardTitle></CardHeader><CardContent>Content</CardContent></Card>`
- **Muted text**: `className="text-muted-foreground"`
- **Flex center**: `className="flex items-center justify-center"`
- **Spacing**: `gap-4`, `p-6`, `space-y-4`

## File Organization
```
src/
  app/
    (protected)/clubs/[clubSlug]/
      page.tsx              # Dashboard
      sessions/
        page.tsx            # List
        new/page.tsx        # Create
        [id]/draft/page.tsx # Edit draft
      players/
        page.tsx            # List
      manage/
        page.tsx            # Settings + profiles
  components/
    ui/                     # shadcn components
    side-nav.tsx
  lib/
    offline/                # Sync system
    supabase/
    auth/
```

## Common Imports
```typescript
// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Icons
import { Plus, Minus, Trash2, Search, Calendar } from "lucide-react";

// Routing
import Link from "next/link";
import { useRouter } from "next/navigation";

// Utils
import { cn } from "@/lib/utils";
import { format } from "date-fns";
```

## RLS Policy Template
```sql
CREATE POLICY table_policy ON table_name
    FOR ALL
    TO authenticated
    USING (club_id IN (
        SELECT club_id FROM club_organisers WHERE user_id = auth.uid()
    ));
```

## Database Constraints
- Club slug: unique globally
- Session slug: unique per club (club_id, slug)
- Match profile weights: must sum to 100
- Game types: 0=singles, 1=doubles

## Error Handling Pattern
```typescript
try {
  const { data, error } = await supabase.from("table").select();
  if (error) throw error;
  return data;
} catch (error) {
  console.error("Failed:", error);
  return null;
}
```

## Testing Offline
1. DevTools → Network → Check "Offline"
2. Refresh page
3. Make changes (should work)
4. Uncheck "Offline"
5. Changes sync automatically

## Theme Colors
- Primary green: `#2ECC71`
- Background: CSS variables in globals.css
- Use Tailwind classes, no arbitrary values

## Never Do
1. Use `getSession()` - use `getUser()` instead
2. Call setState directly in useEffect body
3. Forget cleanup in useEffect
4. Mutate props directly
5. Use `any` type
6. Add comments to code (self-documenting)
7. Use relative time in SSR components

## Always Do
1. Type all props and data
2. Handle loading/error/empty states
3. Check auth before data access
4. Use offline hooks for data
5. Queue changes when offline
6. Use shadcn/ui components
7. Follow existing code patterns
8. Use UK English spelling
