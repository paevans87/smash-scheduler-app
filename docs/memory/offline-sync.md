# Offline Sync System

## Overview
The app supports full offline functionality using IndexedDB for caching and a pending changes queue for sync.

## Key Files
- `src/lib/offline/db.ts` - IndexedDB schema and initialization
- `src/lib/offline/sync-service.ts` - Cache read/write functions
- `src/lib/offline/sync-reconciler.ts` - Syncs pending changes to Supabase
- `src/lib/offline/pending-changes.ts` - Queue management
- `src/lib/offline/use-sessions.ts` - Offline-first hook example
- `src/lib/offline/online-status-provider.tsx` - Online/offline detection

## How It Works

### 1. Initial Load (Online)
```typescript
const { sessions, isLoading, isStale } = useSessions(clubId);
// Fetches from Supabase
// Stores in IndexedDB via syncClubData()
// Displays fresh data (isStale = false)
```

### 2. Offline Mode
```typescript
// When offline:
const { sessions, isLoading, isStale } = useSessions(clubId);
// Reads from IndexedDB cache
// Displays cached data (isStale = true)
// Shows warning: "Showing cached data — changes will sync..."
```

### 3. Making Changes (Works Offline)
```typescript
// Example: Adding player to session
async function handleAddPlayer(playerId: string) {
  // 1. If online: Save to Supabase
  if (isOnline) {
    await supabase.from("session_players").insert(data);
  }
  
  // 2. Always: Cache locally
  await cacheSessionPlayer(data);
  
  // 3. Always: Queue for sync
  await enqueuePendingChange({
    table: "session_players",
    operation: "insert",
    payload: data,
  });
  
  // 4. Update UI immediately
  setCurrentSessionPlayers([...]);
}
```

### 4. Sync When Back Online
```typescript
// Automatic sync via sync-status.tsx component
async function syncPendingChanges(supabase) {
  const changes = await getPendingChanges();
  
  for (const change of changes) {
    try {
      if (change.operation === "insert") {
        await supabase.from(change.table).upsert(change.payload);
      } else if (change.operation === "update") {
        const { id, ...rest } = change.payload;
        await supabase.from(change.table).update(rest).eq("id", id);
      } else if (change.operation === "delete") {
        // Handle compound keys for session_players
        if (change.table === "session_players") {
          const { session_id, player_id } = change.payload;
          await supabase.from(change.table)
            .delete()
            .eq("session_id", session_id)
            .eq("player_id", player_id);
        } else {
          await supabase.from(change.table)
            .delete()
            .eq("id", change.payload.id);
        }
      }
      
      // Remove from queue on success
      await removePendingChange(change.id);
    } catch {
      // Keep in queue on failure, will retry
    }
  }
}
```

## Using Offline Hooks

### useSessions(clubId)
```typescript
const { sessions, isLoading, isStale, mutate } = useSessions(clubId);

// sessions: Session[] - cached or fresh data
// isLoading: boolean - initial load
// isStale: boolean - true if showing cached data
// mutate: () => void - force revalidation
```

### usePlayers(clubId)
Same pattern as useSessions but for players.

## Implementing Offline Support for New Features

### 1. Add to IndexedDB Schema (db.ts)
```typescript
interface SmashSchedulerDB extends DBSchema {
  my_new_table: {
    key: string;
    value: MyNewTableType;
    indexes: { "by-club": string };
  };
}
```

### 2. Add Cache Functions (sync-service.ts)
```typescript
export async function cacheMyData(data: MyDataType) {
  const db = await getDb();
  await db.put("my_new_table", data);
}

export async function getMyDataFromCache(clubId: string) {
  const db = await getDb();
  return db.getAllFromIndex("my_new_table", "by-club", clubId);
}
```

### 3. Create Offline Hook
Follow the pattern in `use-sessions.ts`:
- Check `isOnline` from `useOnlineStatus()`
- If online: fetch from Supabase + cache
- If offline: read from cache
- Return `{ data, isLoading, isStale, mutate }`

### 4. Queue Changes in Components
```typescript
import { useOnlineStatus } from "@/lib/offline/online-status-provider";
import { enqueuePendingChange } from "@/lib/offline/pending-changes";
import { cacheMyData } from "@/lib/offline/sync-service";

function MyComponent() {
  const { isOnline } = useOnlineStatus();
  
  async function handleSave(data) {
    // Save to Supabase if online
    if (isOnline) {
      await supabase.from("my_table").insert(data);
    }
    
    // Always cache and queue
    await cacheMyData(data);
    await enqueuePendingChange({
      table: "my_table",
      operation: "insert",
      payload: data,
    });
  }
}
```

## Important Constraints

1. **UUID Generation**: Must generate client-side when offline
   ```typescript
   const id = crypto.randomUUID(); // Browser API
   ```

2. **Compound Keys**: `session_players` uses composite key (session_id, player_id)
   - Deletion requires both IDs
   - Special handling in sync-reconciler.ts

3. **Conflict Resolution**: Uses upsert for inserts (last write wins)

4. **No Real-time**: Offline mode doesn't support Supabase real-time subscriptions

5. **Image Uploads**: Not supported offline (would need base64 encoding + queue)

## Testing Offline

1. Open DevTools → Network tab
2. Check "Offline" checkbox
3. Refresh page or navigate
4. App should show cached data
5. Make changes - they should queue
6. Uncheck "Offline"
7. Changes should sync automatically (sync-status component polls)

## Common Issues

**Issue**: Stale data after returning online
**Fix**: Call `mutate()` from useSessions/usePlayers to force refresh

**Issue**: Sync conflicts
**Fix**: Use upsert instead of insert for idempotent operations

**Issue**: Large datasets slow down IndexedDB
**Fix**: Only cache necessary data, use pagination
