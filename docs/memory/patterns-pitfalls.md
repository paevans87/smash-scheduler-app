# Common Patterns & Pitfalls

## Data Fetching Patterns

### Server Component (Initial Load)
```typescript
export default async function Page({ params }: { params: Promise<{ clubSlug: string }> }) {
  const { clubSlug } = await params;
  const supabase = await createClient();
  
  // Fetch data
  const { data, error } = await supabase
    .from("table")
    .select("*")
    .eq("club_id", clubId);
    
  if (error) {
    console.error(error);
    return <div>Error loading data</div>;
  }
  
  return <ClientComponent initialData={data} />;
}
```

### Client Component (Interactive/Reactive)
```typescript
"use client";

export default function ClientComponent({ initialData }: { initialData: Data[] }) {
  const [data, setData] = useState(initialData);
  const supabase = createClient();
  
  // Real-time subscription (if needed)
  useEffect(() => {
    const subscription = supabase
      .channel("table_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "table" },
        (payload) => {
          // Update local state
        }
      )
      .subscribe();
      
    return () => {
      subscription.unsubscribe();
    };
  }, []);
}
```

### Offline-First Pattern
```typescript
const { data, isLoading, isStale, mutate } = useSessions(clubId);

// Show stale indicator
{isStale && <Badge variant="outline">Offline Mode</Badge>}

// Force refresh
<Button onClick={mutate}>Refresh</Button>
```

## Form Handling

### Controlled Inputs
```typescript
const [value, setValue] = useState("");

<Input
  value={value}
  onChange={(e) => setValue(e.target.value)}
/>
```

### Form Validation
```typescript
const isValid = 
  name.trim() !== "" && 
  email.includes("@") &&
  count >= 1;

<Button type="submit" disabled={!isValid}>
  Submit
</Button>
```

### Loading State
```typescript
const [isLoading, setIsLoading] = useState(false);

async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  if (!isValid) return;
  
  setIsLoading(true);
  try {
    await saveData();
    router.push("/success");
  } catch (error) {
    console.error(error);
    // Stay on page, show error
  } finally {
    setIsLoading(false);
  }
}
```

## Error Handling

### Try-Catch Pattern
```typescript
try {
  const { data, error } = await supabase.from("table").select();
  if (error) throw error;
  setData(data);
} catch (error) {
  console.error("Failed to load:", error);
  // Show error toast/notification
} finally {
  setIsLoading(false);
}
```

### Error Boundaries
Create `error.tsx` in route folder:
```typescript
"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

## Common Pitfalls

### ❌ Using getSession() instead of getUser()
**Wrong:**
```typescript
const { data: { session } } = await supabase.auth.getSession();
// session can be spoofed client-side
```

**Right:**
```typescript
const { data: { user } } = await supabase.auth.getUser();
// Validates JWT server-side
```

### ❌ Calling setState in useEffect directly
**Wrong:**
```typescript
useEffect(() => {
  setState("loaded"); // Can cause infinite loops
}, []);
```

**Right:**
```typescript
useEffect(() => {
  async function load() {
    const data = await fetchData();
    if (!cancelled) {
      setState(data);
    }
  }
  load();
}, []);
```

### ❌ Forgetting to handle cleanup
**Wrong:**
```typescript
useEffect(() => {
  window.addEventListener("resize", handler);
  // No cleanup!
}, []);
```

**Right:**
```typescript
useEffect(() => {
  window.addEventListener("resize", handler);
  return () => {
    window.removeEventListener("resize", handler);
  };
}, []);
```

### ❌ Using relative time in SSR
**Wrong:**
```typescript
<p>Last updated {new Date().toLocaleString()}</p>
// Hydration mismatch!
```

**Right:**
```typescript
// Use client component
"use client";
<p>Last updated {new Date().toLocaleString()}</p>
// Or use suppressHydrationWarning
<p suppressHydrationWarning>{new Date().toLocaleString()}</p>
```

### ❌ Not checking for loading state
**Wrong:**
```typescript
const { data } = useQuery();
return <div>{data.name}</div>; // data might be undefined!
```

**Right:**
```typescript
const { data, isLoading } = useQuery();
if (isLoading) return <div>Loading...</div>;
if (!data) return <div>No data</div>;
return <div>{data.name}</div>;
```

### ❌ Modifying props directly
**Wrong:**
```typescript
function Component({ items }) {
  items.push(newItem); // Mutates prop!
  return <div>...</div>;
}
```

**Right:**
```typescript
function Component({ items: initialItems }) {
  const [items, setItems] = useState(initialItems);
  setItems([...items, newItem]); // Creates new array
  return <div>...</div>;
}
```

### ❌ Forgetting to await async functions
**Wrong:**
```typescript
function handleClick() {
  saveData(); // Not awaited!
  router.push("/next"); // Might navigate before save completes
}
```

**Right:**
```typescript
async function handleClick() {
  await saveData();
  router.push("/next");
}
```

## Best Practices

### 1. Use TypeScript Strictly
Always define types for props and data:
```typescript
type Props = {
  clubId: string;
  clubSlug: string;
  defaultCourtCount: number;
};

export function Component({ clubId, clubSlug, defaultCourtCount }: Props) {
```

### 2. Keep Components Small
- Max 200 lines per component
- Extract sub-components
- Use custom hooks for logic

### 3. Use Consistent Naming
- Components: PascalCase (`MatchMakingProfile`)
- Files: kebab-case (`match-making-profile.tsx`)
- Hooks: camelCase starting with "use" (`useSessions`)
- Constants: UPPER_SNAKE_CASE (`STORAGE_KEY`)

### 4. Handle All Edge Cases
```typescript
// Check all states
if (isLoading) return <Loading />;
if (error) return <Error message={error.message} />;
if (data.length === 0) return <Empty />;
return <DataList data={data} />;
```

### 5. Memoize Expensive Computations
```typescript
import { useMemo } from "react";

const sortedData = useMemo(() => {
  return data.sort((a, b) => a.name.localeCompare(b.name));
}, [data]);
```

### 6. Use Debounce for Search
```typescript
import { useDebounce } from "use-debounce";

const [searchTerm, setSearchTerm] = useState("");
const [debouncedTerm] = useDebounce(searchTerm, 300);

useEffect(() => {
  search(debouncedTerm);
}, [debouncedTerm]);
```

### 7. Prefer Server Components
- Use Server Components by default
- Only use Client Components when needed:
  - Interactivity (onClick, useState)
  - Browser APIs (window, localStorage)
  - Real-time subscriptions

### 8. Validate Environment Variables
```typescript
// At app startup
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL");
}
```

## Performance Tips

1. **Image Optimization**: Use `next/image` component
2. **Font Loading**: Use `next/font` for Google Fonts
3. **Code Splitting**: Automatic with Next.js dynamic imports
4. **Database Queries**: Select only needed columns
5. **Caching**: Use `unstable_cache` for expensive operations

## Debugging Tips

1. **Supabase Logs**: Check PostgREST/Auth logs in Supabase dashboard
2. **Browser DevTools**: Network tab for API calls, Application tab for IndexedDB
3. **React DevTools**: Components tab for props/state
4. **Console Logs**: Use `console.log({ variable })` for object logging
