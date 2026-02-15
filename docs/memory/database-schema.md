# Database Schema

## Core Tables

### clubs
Club information and settings.

```sql
id: UUID PRIMARY KEY
name: TEXT NOT NULL
slug: TEXT UNIQUE NOT NULL
default_court_count: INT NOT NULL DEFAULT 1
game_type: SMALLINT NOT NULL DEFAULT 1  -- 0=singles, 1=doubles
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

**Constraints:**
- `chk_clubs_game_type`: game_type IN (0, 1)

### players
Club members/players.

```sql
id: UUID PRIMARY KEY
club_id: UUID REFERENCES clubs(id) ON DELETE CASCADE
name: TEXT NOT NULL
skill_level: INT NOT NULL DEFAULT 5  -- 1-10 scale
gender: SMALLINT NOT NULL DEFAULT 0   -- 0=not specified, 1=male, 2=female
play_style_preference: SMALLINT DEFAULT 0
is_archived: BOOLEAN DEFAULT false
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

**Indexes:**
- idx_players_club_id
- idx_players_archived

### sessions
Badminton sessions.

```sql
id: UUID PRIMARY KEY
club_id: UUID REFERENCES clubs(id) ON DELETE CASCADE
slug: TEXT NOT NULL  -- unique per club (club_id, slug)
scheduled_date_time: TIMESTAMPTZ NOT NULL
court_count: INT NOT NULL DEFAULT 1
state: SMALLINT NOT NULL DEFAULT 0  -- 0=draft, 1=active, 2=complete
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

**Constraints:**
- `uq_sessions_club_slug`: UNIQUE (club_id, slug)

**Indexes:**
- idx_sessions_club_id
- idx_sessions_date_time

### session_players
Players assigned to sessions.

```sql
session_id: UUID REFERENCES sessions(id) ON DELETE CASCADE
player_id: UUID REFERENCES players(id) ON DELETE CASCADE
is_active: BOOLEAN DEFAULT true
joined_at: TIMESTAMPTZ

PRIMARY KEY (session_id, player_id)
```

**Indexes:**
- idx_session_players_session_id
- idx_session_players_player_id

### session_court_labels
Custom names for courts in a session.

```sql
session_id: UUID REFERENCES sessions(id) ON DELETE CASCADE
court_number: INT NOT NULL
label: TEXT NOT NULL

PRIMARY KEY (session_id, court_number)
```

### match_making_profiles
Algorithm profiles for match making.

```sql
id: UUID PRIMARY KEY
club_id: UUID REFERENCES clubs(id) ON DELETE CASCADE
name: TEXT NOT NULL
weight_skill_balance: INT NOT NULL DEFAULT 40
weight_time_off_court: INT NOT NULL DEFAULT 35
weight_match_history: INT NOT NULL DEFAULT 25
apply_gender_matching: BOOLEAN DEFAULT false
blacklist_mode: SMALLINT DEFAULT 0  -- 0=preferred, 1=strict
is_default: BOOLEAN DEFAULT false
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

**Constraints:**
- Weights must sum to 100
- Weights must be >= 0
- One default per club

### blacklists
Player pairings to avoid.

```sql
id: UUID PRIMARY KEY
player_id: UUID REFERENCES players(id) ON DELETE CASCADE
blacklisted_player_id: UUID REFERENCES players(id) ON DELETE CASCADE
created_at: TIMESTAMPTZ

UNIQUE (player_id, blacklisted_player_id)
```

### subscriptions
Stripe subscription tracking.

```sql
id: UUID PRIMARY KEY
club_id: UUID REFERENCES clubs(id) ON DELETE CASCADE
plan_type: TEXT NOT NULL  -- 'free', 'pro'
status: TEXT NOT NULL     -- 'active', 'trialling', 'cancelled'
stripe_subscription_id: TEXT
stripe_customer_id: TEXT
current_period_end: TIMESTAMPTZ
created_at: TIMESTAMPTZ
updated_at: TIMESTAMPTZ
```

### club_organisers
Club membership (many-to-many users-clubs).

```sql
club_id: UUID REFERENCES clubs(id) ON DELETE CASCADE
user_id: UUID REFERENCES auth.users(id) ON DELETE CASCADE
role: TEXT DEFAULT 'organiser'
joined_at: TIMESTAMPTZ DEFAULT now()

PRIMARY KEY (club_id, user_id)
```

## RLS Policies

All tables have RLS enabled. Common pattern:

```sql
-- Example: sessions table
CREATE POLICY sessions_policy ON sessions
    FOR ALL
    TO authenticated
    USING (
        club_id IN (SELECT club_id FROM club_organisers WHERE user_id = auth.uid())
    )
    WITH CHECK (
        club_id IN (SELECT club_id FROM club_organisers WHERE user_id = auth.uid())
    );
```

## Important Notes

1. **Slugs**: 
   - `clubs.slug` is globally unique
   - `sessions.slug` is unique per club (format: YYYY-MM-DD or YYYY-MM-DD-N for duplicates)
   - Generated automatically on insert

2. **Session States:**
   - 0 = Draft (being configured)
   - 1 = Active (players assigned, ready to play)
   - 2 = Complete (finished)

3. **Game Types:**
   - 0 = Singles (min 2 players per session)
   - 1 = Doubles (min 4 players per session)

4. **Soft Deletes:**
   - Players use `is_archived` instead of hard delete
   - Sessions use `state` field

## RPC Functions

### create_club_with_stripe_subscription
Creates club + subscription + organiser in one transaction.

```sql
Parameters:
- p_club_name: TEXT
- p_plan_type: TEXT ('free', 'pro')
- p_status: TEXT ('active', 'trialling')
- p_stripe_subscription_id: TEXT
- p_stripe_customer_id: TEXT
- p_current_period_end: TIMESTAMPTZ
- p_user_id: UUID
```

## Offline Cache Schema (IndexedDB)

Stored in browser via `idb` library:

### Object Stores
- **sessions**: Same schema as DB
- **session_players**: Same schema as DB
- **players**: Same schema as DB
- **matches**: Match data
- **match_players**: Match assignments
- **pending_changes**: Queue for offline changes

### Pending Changes Structure
```typescript
{
  id?: number;  // auto-increment
  table: string;
  operation: "insert" | "update" | "delete";
  payload: Record<string, unknown>;
  created_at: string;
}
```
