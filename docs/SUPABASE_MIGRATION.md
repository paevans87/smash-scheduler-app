# Supabase Database Migration Guide

## Overview

This document contains the complete database schema and setup scripts for migrating SmashScheduler from IndexedDB to Supabase with cloud synchronisation support.

---

## Database Schema

### Entity Relationship Diagram

```
┌─────────────┐
│   clubs     │
└──────┬──────┘
       │
       ├──────────────┬─────────────────┐
       │              │                 │
       ▼              ▼                 ▼
┌──────────┐   ┌───────────┐    ┌────────────┐
│ players  │   │ sessions  │    │ sync_state │
└────┬─────┘   └─────┬─────┘    └────────────┘
     │               │
     ├───────────────┼──────────────┐
     │               │              │
     ▼               ▼              ▼
┌─────────────────┐ ┌───────┐  ┌─────────────┐
│ player_         │ │matches│  │session_     │
│ blacklists      │ └───────┘  │players      │
└─────────────────┘            └─────────────┘
```

---

## Table Definitions

### 1. clubs

Stores club configurations including court setup and game type.

```sql
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    default_court_count INTEGER NOT NULL DEFAULT 1,
    game_type INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT clubs_court_count_check CHECK (default_court_count > 0),
    CONSTRAINT clubs_game_type_check CHECK (game_type IN (0, 1))
);

CREATE INDEX idx_clubs_name ON clubs(name);
CREATE INDEX idx_clubs_created_at ON clubs(created_at DESC);
```

**Enumerations:**
- `game_type`: 0 = Singles, 1 = Doubles

---

### 2. players

Stores player profiles with skill levels and preferences.

```sql
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    skill_level INTEGER NOT NULL DEFAULT 5,
    gender INTEGER NOT NULL DEFAULT 2,
    play_style_preference INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT players_skill_level_check CHECK (skill_level BETWEEN 1 AND 10),
    CONSTRAINT players_gender_check CHECK (gender IN (0, 1, 2)),
    CONSTRAINT players_play_style_check CHECK (play_style_preference IN (0, 1, 2))
);

CREATE INDEX idx_players_club_id ON players(club_id);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_skill_level ON players(skill_level);
```

**Enumerations:**
- `gender`: 0 = Male, 1 = Female, 2 = Other
- `play_style_preference`: 0 = Level, 1 = Mixed, 2 = Open

---

### 3. sessions

Stores game sessions with scheduling and state information.

```sql
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    scheduled_date_time TIMESTAMPTZ NOT NULL,
    court_count INTEGER NOT NULL,
    state INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sessions_court_count_check CHECK (court_count > 0),
    CONSTRAINT sessions_state_check CHECK (state IN (0, 1, 2))
);

CREATE INDEX idx_sessions_club_id ON sessions(club_id);
CREATE INDEX idx_sessions_scheduled_date_time ON sessions(scheduled_date_time DESC);
CREATE INDEX idx_sessions_state ON sessions(state);
```

**Enumerations:**
- `state`: 0 = Draft, 1 = Active, 2 = Complete

---

### 4. matches

Stores individual match records within sessions.

```sql
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    court_number INTEGER NOT NULL,
    state INTEGER NOT NULL DEFAULT 0,
    was_automated BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score_json TEXT,
    player_ids_json TEXT NOT NULL,
    winning_player_ids_json TEXT,

    CONSTRAINT matches_state_check CHECK (state IN (0, 1)),
    CONSTRAINT matches_court_number_check CHECK (court_number > 0)
);

CREATE INDEX idx_matches_session_id ON matches(session_id);
CREATE INDEX idx_matches_state ON matches(state);
CREATE INDEX idx_matches_started_at ON matches(started_at DESC);
```

**Enumerations:**
- `state`: 0 = InProgress, 1 = Completed

**JSON Fields:**
- `score_json`: `{"team1Score": number, "team2Score": number}`
- `player_ids_json`: `["uuid1", "uuid2", ...]`
- `winning_player_ids_json`: `["uuid1", "uuid2", ...]`

---

### 5. player_blacklists

Stores player pairing restrictions for matchmaking.

```sql
CREATE TABLE player_blacklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    blacklisted_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    blacklist_type INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT player_blacklists_type_check CHECK (blacklist_type IN (0, 1)),
    CONSTRAINT player_blacklists_self_check CHECK (player_id != blacklisted_player_id),
    CONSTRAINT player_blacklists_unique UNIQUE (player_id, blacklisted_player_id, blacklist_type)
);

CREATE INDEX idx_player_blacklists_player_id ON player_blacklists(player_id);
CREATE INDEX idx_player_blacklists_blacklisted_player_id ON player_blacklists(blacklisted_player_id);
```

**Enumerations:**
- `blacklist_type`: 0 = Partner, 1 = Opponent

---

### 6. session_players (Optional In-Memory Join Table)

If you need to persist session player registrations:

```sql
CREATE TABLE session_players (
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (session_id, player_id)
);

CREATE INDEX idx_session_players_session_id ON session_players(session_id);
CREATE INDEX idx_session_players_player_id ON session_players(player_id);
```

---

### 7. sync_state (Cloud Sync Metadata)

Tracks synchronisation state for offline-first functionality.

```sql
CREATE TABLE sync_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id VARCHAR(255),

    CONSTRAINT sync_state_operation_check CHECK (operation IN ('insert', 'update', 'delete'))
);

CREATE INDEX idx_sync_state_entity ON sync_state(entity_type, entity_id);
CREATE INDEX idx_sync_state_synced_at ON sync_state(synced_at DESC);
CREATE INDEX idx_sync_state_device_id ON sync_state(device_id);
```

---

## Database Setup Scripts

### Complete Setup Script

```sql
-- ============================================
-- SmashScheduler Supabase Database Setup
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Create Tables
-- ============================================

-- Clubs Table
CREATE TABLE clubs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    default_court_count INTEGER NOT NULL DEFAULT 1,
    game_type INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT clubs_court_count_check CHECK (default_court_count > 0),
    CONSTRAINT clubs_game_type_check CHECK (game_type IN (0, 1))
);

-- Players Table
CREATE TABLE players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    skill_level INTEGER NOT NULL DEFAULT 5,
    gender INTEGER NOT NULL DEFAULT 2,
    play_style_preference INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT players_skill_level_check CHECK (skill_level BETWEEN 1 AND 10),
    CONSTRAINT players_gender_check CHECK (gender IN (0, 1, 2)),
    CONSTRAINT players_play_style_check CHECK (play_style_preference IN (0, 1, 2))
);

-- Sessions Table
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    club_id UUID NOT NULL REFERENCES clubs(id) ON DELETE CASCADE,
    scheduled_date_time TIMESTAMPTZ NOT NULL,
    court_count INTEGER NOT NULL,
    state INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT sessions_court_count_check CHECK (court_count > 0),
    CONSTRAINT sessions_state_check CHECK (state IN (0, 1, 2))
);

-- Matches Table
CREATE TABLE matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    court_number INTEGER NOT NULL,
    state INTEGER NOT NULL DEFAULT 0,
    was_automated BOOLEAN NOT NULL DEFAULT false,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    score_json TEXT,
    player_ids_json TEXT NOT NULL,
    winning_player_ids_json TEXT,

    CONSTRAINT matches_state_check CHECK (state IN (0, 1)),
    CONSTRAINT matches_court_number_check CHECK (court_number > 0)
);

-- Player Blacklists Table
CREATE TABLE player_blacklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    blacklisted_player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    blacklist_type INTEGER NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT player_blacklists_type_check CHECK (blacklist_type IN (0, 1)),
    CONSTRAINT player_blacklists_self_check CHECK (player_id != blacklisted_player_id),
    CONSTRAINT player_blacklists_unique UNIQUE (player_id, blacklisted_player_id, blacklist_type)
);

-- Session Players Table (Optional)
CREATE TABLE session_players (
    session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
    player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
    registered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    PRIMARY KEY (session_id, player_id)
);

-- Sync State Table
CREATE TABLE sync_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL,
    synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    device_id VARCHAR(255),

    CONSTRAINT sync_state_operation_check CHECK (operation IN ('insert', 'update', 'delete'))
);

-- ============================================
-- 2. Create Indices
-- ============================================

-- Clubs Indices
CREATE INDEX idx_clubs_name ON clubs(name);
CREATE INDEX idx_clubs_created_at ON clubs(created_at DESC);

-- Players Indices
CREATE INDEX idx_players_club_id ON players(club_id);
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_skill_level ON players(skill_level);

-- Sessions Indices
CREATE INDEX idx_sessions_club_id ON sessions(club_id);
CREATE INDEX idx_sessions_scheduled_date_time ON sessions(scheduled_date_time DESC);
CREATE INDEX idx_sessions_state ON sessions(state);

-- Matches Indices
CREATE INDEX idx_matches_session_id ON matches(session_id);
CREATE INDEX idx_matches_state ON matches(state);
CREATE INDEX idx_matches_started_at ON matches(started_at DESC);

-- Player Blacklists Indices
CREATE INDEX idx_player_blacklists_player_id ON player_blacklists(player_id);
CREATE INDEX idx_player_blacklists_blacklisted_player_id ON player_blacklists(blacklisted_player_id);

-- Session Players Indices
CREATE INDEX idx_session_players_session_id ON session_players(session_id);
CREATE INDEX idx_session_players_player_id ON session_players(player_id);

-- Sync State Indices
CREATE INDEX idx_sync_state_entity ON sync_state(entity_type, entity_id);
CREATE INDEX idx_sync_state_synced_at ON sync_state(synced_at DESC);
CREATE INDEX idx_sync_state_device_id ON sync_state(device_id);

-- ============================================
-- 3. Create Updated_At Trigger Function
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 4. Apply Updated_At Triggers
-- ============================================

CREATE TRIGGER update_clubs_updated_at
    BEFORE UPDATE ON clubs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at
    BEFORE UPDATE ON players
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sessions_updated_at
    BEFORE UPDATE ON sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. Row Level Security (RLS) Setup
-- ============================================

-- Enable RLS on all tables
ALTER TABLE clubs ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_blacklists ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_state ENABLE ROW LEVEL SECURITY;

-- Public access policies (adjust based on your authentication strategy)
CREATE POLICY "Enable read access for all users" ON clubs
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON clubs
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON players
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON players
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON sessions
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON sessions
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON matches
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON matches
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON player_blacklists
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON player_blacklists
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for all users" ON session_players
    FOR SELECT USING (true);

CREATE POLICY "Enable all access for authenticated users" ON session_players
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Enable all access for authenticated users" ON sync_state
    FOR ALL USING (auth.role() = 'authenticated');

-- ============================================
-- 6. Realtime Publication (for live updates)
-- ============================================

-- Enable realtime for tables that need live updates
ALTER PUBLICATION supabase_realtime ADD TABLE clubs;
ALTER PUBLICATION supabase_realtime ADD TABLE players;
ALTER PUBLICATION supabase_realtime ADD TABLE sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE session_players;

-- ============================================
-- Setup Complete
-- ============================================
```

---

## Migration Strategy

### Option 1: Fresh Start (Recommended for New Deployments)

1. Run the complete setup script in Supabase SQL Editor
2. Start using the application with the new database
3. Existing IndexedDB data remains local only

### Option 2: Data Migration

If you need to migrate existing IndexedDB data:

```sql
-- Example: Bulk insert clubs from exported JSON
INSERT INTO clubs (id, name, default_court_count, game_type, created_at, updated_at)
SELECT
    (data->>'id')::UUID,
    data->>'name',
    (data->>'defaultCourtCount')::INTEGER,
    (data->>'gameType')::INTEGER,
    (data->>'createdAt')::TIMESTAMPTZ,
    (data->>'updatedAt')::TIMESTAMPTZ
FROM json_array_elements('[...]'::JSON) AS data;
```

Create a C# migration utility in your codebase that:
1. Exports all IndexedDB data to JSON
2. Transforms field names (camelCase → snake_case)
3. Uploads to Supabase via REST API or direct SQL

---

## Cloud Sync Architecture

### Sync Flow

```
┌─────────────┐
│  IndexedDB  │ (Local cache)
└──────┬──────┘
       │
       ↕ (Bidirectional sync)
       │
┌──────┴──────┐
│  Supabase   │ (Cloud source of truth)
└─────────────┘
```

### Recommended Sync Strategy

1. **Write**: Write to IndexedDB immediately (offline-first)
2. **Queue**: Add operation to sync queue
3. **Sync**: Push to Supabase when online
4. **Conflict Resolution**: Last-write-wins using `updated_at` timestamp
5. **Pull**: Subscribe to Supabase realtime for remote changes

---

## Environment Configuration

Add these to your `.env` or `appsettings.json`:

```json
{
  "Supabase": {
    "Url": "https://your-project.supabase.co",
    "AnonKey": "your-anon-key",
    "ServiceRoleKey": "your-service-role-key"
  },
  "Sync": {
    "Enabled": true,
    "AutoSyncInterval": 30000,
    "ConflictResolution": "LastWriteWins"
  }
}
```

---

## Next Steps

1. **Install Supabase Client**: Add `supabase-csharp` NuGet package
2. **Create Repository Layer**: Implement `ISupabaseRepository<T>` interfaces
3. **Implement Sync Service**: Build bidirectional sync with conflict resolution
4. **Add Offline Queue**: Queue operations when offline
5. **Testing**: Test offline scenarios, conflict resolution, and data integrity
6. **Migration Tool**: Build data export/import utility for existing users

---

## Security Considerations

1. **RLS Policies**: Modify policies to restrict access based on your authentication model
2. **API Keys**: Never commit Supabase keys to source control
3. **Service Role Key**: Only use service role key server-side, never client-side
4. **Data Validation**: Validate all data on both client and server
5. **Audit Trail**: Use `sync_state` table to track all data modifications

---

## Monitoring Queries

```sql
-- Check total records per table
SELECT
    'clubs' as table_name, COUNT(*) as count FROM clubs
UNION ALL
SELECT 'players', COUNT(*) FROM players
UNION ALL
SELECT 'sessions', COUNT(*) FROM sessions
UNION ALL
SELECT 'matches', COUNT(*) FROM matches
UNION ALL
SELECT 'player_blacklists', COUNT(*) FROM player_blacklists
UNION ALL
SELECT 'session_players', COUNT(*) FROM session_players
UNION ALL
SELECT 'sync_state', COUNT(*) FROM sync_state;

-- Check recent sync activity
SELECT
    entity_type,
    operation,
    COUNT(*) as count,
    MAX(synced_at) as last_sync
FROM sync_state
WHERE synced_at > NOW() - INTERVAL '1 day'
GROUP BY entity_type, operation
ORDER BY entity_type, operation;

-- Find unsynced changes (if using sync queue)
SELECT
    entity_type,
    entity_id,
    operation,
    synced_at
FROM sync_state
WHERE synced_at IS NULL
ORDER BY created_at DESC;
```

---

## Rollback Script

```sql
-- WARNING: This will delete all data and tables
-- Use with caution!

DROP TABLE IF EXISTS sync_state CASCADE;
DROP TABLE IF EXISTS session_players CASCADE;
DROP TABLE IF EXISTS player_blacklists CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column CASCADE;
```

---

## Support

For issues or questions:
- Supabase Docs: https://supabase.com/docs
- Supabase C# Client: https://github.com/supabase-community/supabase-csharp
