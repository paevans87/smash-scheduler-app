# SmashScheduler Feature Specification

## Overview
SmashScheduler automates badminton session management by removing manual matchmaking burden from club organisers. The system creates fair, skill-balanced matches whilst respecting player preferences and social dynamics.

---

## Success Metrics
- **Primary**: Percentage of automated matches NOT manually overridden by organiser
- **Secondary**: User-reported increase in games played per session (qualitative feedback)

---

## Feature Modules

### 1. Club Management

#### 1.1 Create Club
- Organiser can create a new club with:
  - Club name (required)
  - Default court count (required)
  - Game type: Singles or Doubles (required)

#### 1.2 View Club Details
- Organiser can view club configuration
- Display club name, default court count, and game type

#### 1.3 Edit Club
- Organiser can modify club name, default court count, or game type
- Changes apply to future sessions only

#### 1.4 Delete Club
- Organiser can delete a club
- System removes all associated data (players, sessions, matches)

---

### 2. Player Management

#### 2.1 Create Player
- Organiser can add a player to club roster with:
  - Name (required)
  - Skill level: 1-10 scale (required, admin-judged)
  - Gender (required)
  - Play-style preference: Level / Mixed / Open (required)
  - Partner blacklist: List of players to avoid as partners (optional)
  - Opponent blacklist: List of players to avoid as opponents (optional)

#### 2.2 View Player Profile
- Organiser can view complete player profile
- Display all player attributes and blacklist entries

#### 2.3 Edit Player
- Organiser can modify any player attribute
- Skill level changes only apply outside active sessions

#### 2.4 Manage Blacklists
- Organiser can add club players to a player's partner or opponent blacklist
- System prevents duplicate entries
- No limit on blacklist size

#### 2.5 Delete Player
- Organiser can remove a player from club roster
- System removes player from all future sessions

---

### 3. Session Management

#### 3.1 Create Session (Draft Mode)
- Organiser can create a new session with:
  - Date and time (required)
  - Court count override (optional, defaults to club default)
- Session begins in "Draft" state

#### 3.2 Add Players to Session
- Organiser can add players from club roster to session
- Players added whilst session is in Draft state

#### 3.3 Attendance Check
- Organiser can review session roster whilst in Draft state
- Organiser can remove players who are not attending

#### 3.4 Activate Session
- Organiser transitions session from "Draft" to "Active"
- Court count becomes locked
- Matchmaking becomes available
- Session roster becomes fixed (except inactive toggle)

#### 3.5 Mark Player Inactive
- Organiser can mark a player as "inactive" during Active session
- Inactive players are excluded from future matchmaking
- Player remains in session roster but unavailable for new matches

#### 3.6 Complete Session
- Organiser marks session as "Complete"
- Session becomes read-only
- Organiser can still edit if necessary (override read-only)

#### 3.7 View Session History
- Organiser can view list of all past sessions
- Display date, player count, match count, and session state

#### 3.8 Delete Session
- Organiser can delete any session
- System removes all associated match data

---

### 4. Automated Matchmaking

#### 4.1 Generate Matches
- System creates court assignments for available players
- Algorithm considers (in priority order):
  1. Level-based gameplay (primary weight)
  2. Skill balance across teams
  3. Blacklist avoidance (soft constraint, weighted scoring)
  4. Time off court (fairness rotation)
- Handles odd player counts gracefully (flexible court assignments)

#### 4.2 Court Capacity Enforcement
- Singles: 2 players per court
- Doubles: 4 players per court
- System adjusts based on club game type setting

#### 4.3 Bench Calculation
- System automatically identifies players not assigned to current matches
- Display "bench" list showing who is sitting off
- Prioritise benched players for next matchmaking round

---

### 5. Manual Matchmaking

#### 5.1 Override Match
- Organiser can manually modify automated match assignments
- Organiser can replace individual players in a match
- Organiser can reassign entire court configurations

#### 5.2 Create Manual Match
- Organiser can create matches from scratch without using algorithm
- System validates player availability (not already in active match)

---

### 6. Match Management

#### 6.1 Start Match
- System marks match as "In-Progress" when assigned
- Players assigned to court number

#### 6.2 Complete Match
- Organiser marks match as "Completed" when players finish
- Returns players to bench pool for next matchmaking round

#### 6.3 Record Match Result (Optional)
- Organiser can optionally record:
  - Winning team/player
  - Match score
- Results contribute to analytics

---

### 7. Session Analytics

#### 7.1 Real-Time Session Statistics
- Display during active session:
  - Current match count
  - Players on bench
  - Approximate play time per player
  - Games played per player

#### 7.2 Session Summary
- Display after session completion:
  - Total matches played
  - Total game time
  - Player participation breakdown
  - Override rate (manual vs automated matches)

---

### 8. Historical Analytics (Low Priority)

#### 8.1 Player Partnership Statistics
- Track across all completed sessions:
  - Top 3 players most frequently played WITH
  - Top 3 partners with highest win rate
  - Top 3 partners with lowest win rate

#### 8.2 Cross-Session Insights
- Player total games played
- Player average play time per session
- Skill level distribution across club

---

## Non-Functional Requirements

### Data Persistence
- All data stored locally using SQLite
- Auto-save session state for crash recovery
- No cloud synchronisation or backup

### Data Lifecycle
- Sessions retained indefinitely until user deletion
- All entities (clubs, players, sessions) support deletion
- No automatic archival or data expiry

### Language
- All UI text in English (UK)
- Use UK spelling conventions throughout (e.g., "organiser", "colour", "centre")

### User Experience
- Intuitive navigation
- Modern, attractive visual design
- Responsive feedback for all actions

---

## Out of Scope (MVP)
- Online synchronisation or cloud backup
- Tournament or league ladder tracking
- Financial or membership fee tracking
- Multi-device support
- Data export capabilities
- Automated skill level adjustment based on results
