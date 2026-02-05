# SmashScheduler - Complete System Handoff Document

> **Purpose**: This document provides complete context for an AI agent to continue development of the SmashScheduler application. It captures the project's goals, architecture, current state, and outstanding work.

---

## 1. PROJECT OVERVIEW

**SmashScheduler** is a badminton session management Progressive Web App (PWA) that automates player matchmaking for club sessions. It runs entirely in the browser using Blazor WebAssembly with IndexedDB for local storage.

### Core Problem
Club organisers manually create balanced doubles matches during sessions, which is:
- Time-consuming (players waiting while matches are calculated)
- Error-prone (forgetting who played together, unbalanced skill matches)
- Unfair (some players sit out longer than others)

### Solution
Automated matchmaking algorithm that:
- Balances skill levels across teams
- Rotates players fairly (prioritises those waiting longest)
- Respects player preferences and blacklists
- Allows manual overrides when needed

---

## 2. TECHNOLOGY STACK

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Blazor WebAssembly | .NET 10.0 |
| Language | C# | 12 |
| UI Components | MudBlazor | 8.15.0 |
| State Management | Fluxor | 6.9.0 |
| Storage | IndexedDB | Browser-native |
| Testing | xUnit + bUnit | Latest |

### Key Architectural Decisions
1. **Blazor WASM** (not Server) - Enables offline-first, no backend required
2. **IndexedDB** (not SQLite) - Browser-native, structured queries, offline support
3. **Fluxor/Redux** - Predictable state management, unidirectional data flow
4. **Repository Pattern** - Abstracts data layer from business logic
5. **Strategy Pattern** - Pluggable matchmaking scoring algorithms

---

## 3. PROJECT STRUCTURE

```
smash-scheduler/
├── src/
│   ├── SmashScheduler.Domain/           # Entities, Enums, Value Objects
│   ├── SmashScheduler.Application/      # Services, Interfaces, Business Logic
│   ├── SmashScheduler.Infrastructure.Web/  # IndexedDB Repositories
│   ├── SmashScheduler.Web/              # Blazor WASM UI (Pages, Components, State)
│   └── SmashScheduler.Shared/           # Common utilities
├── tests/
│   ├── SmashScheduler.Tests/            # Unit tests (38 tests)
│   └── SmashScheduler.Web.Tests/        # Component tests (64 tests)
├── specs/
│   ├── features.md                      # Feature specification
│   ├── architecture.md                  # Technical architecture
│   └── design_system.md                 # UI design guidelines
├── CLAUDE.md                            # AI coding instructions
├── CODING_STANDARDS.md                  # Code style guidelines
├── GOAL.md                              # Original project vision
└── README.md                            # Project overview
```

---

## 4. DOMAIN MODEL

### Core Entities

```
Club (1) ──────< (many) Player
  │                    │
  │                    │ (blacklists)
  │                    ├──< PlayerBlacklist (partner)
  │                    └──< PlayerBlacklist (opponent)
  │
  └──< (many) Session
                │
                ├──< SessionPlayer (join table, tracks attendance)
                │
                └──< Match
                      │
                      └── PlayerIds (JSON array of 4 player GUIDs)
```

### Entity Details

**Club**
- Id, Name, DefaultCourtCount, GameType (Singles/Doubles), CreatedAt, UpdatedAt

**Player**
- Id, ClubId, Name, SkillLevel (1-10), Gender (Male/Female/Other), PlayStylePreference (Level/Mixed/Open)

**Session**
- Id, ClubId, ScheduledDateTime, CourtCount, State (Draft/Active/Complete), CourtLabelsJson
- Computed: BenchedPlayers, ActivePlayers, GetCourtLabel(int)

**Match**
- Id, SessionId, CourtNumber, State (InProgress/Completed), WasAutomated, StartedAt, CompletedAt
- JSON fields: PlayerIdsJson, WinningPlayerIdsJson, ScoreJson

**SessionPlayer** (Join Table)
- SessionId, PlayerId, IsActive, JoinedAt

**PlayerBlacklist**
- PlayerId, BlacklistedPlayerId, BlacklistType (Partner/Opponent)

### Enums
- GameType: Singles, Doubles
- SessionState: Draft, Active, Complete
- MatchState: InProgress, Completed
- Gender: Male, Female, Other
- PlayStylePreference: Level, Mixed, Open
- BlacklistType: Partner, Opponent

---

## 5. SERVICE LAYER

### IClubService
- GetByIdAsync, GetAllAsync, CreateClubAsync, UpdateClubAsync, DeleteClubAsync

### IPlayerService
- GetByIdAsync, GetByClubIdAsync, CreatePlayerAsync, UpdatePlayerAsync, DeletePlayerAsync
- AddBlacklistAsync, RemoveBlacklistAsync, GetBlacklistsAsync

### ISessionService
- GetByIdAsync, GetByClubIdAsync, CreateSessionAsync, UpdateSessionAsync, DeleteSessionAsync
- AddPlayerToSessionAsync, RemovePlayerFromSessionAsync, MarkPlayerInactiveAsync

### ISessionStateManager
- ActivateSessionAsync (Draft → Active)
- CompleteSessionAsync (Active → Complete)

### IMatchService
- GetByIdAsync, GetBySessionIdAsync, CreateMatchAsync, UpdateMatchPlayersAsync, CompleteMatchAsync, DeleteMatchAsync

### IMatchmakingService
- GenerateMatchesAsync(sessionId) → List<MatchCandidate>
- GenerateSingleMatchAsync(sessionId, courtNumber) → MatchCandidate?

---

## 6. MATCHMAKING ALGORITHM

### Scoring Weights
| Scorer | Weight | Purpose |
|--------|--------|---------|
| SkillBalanceScorer | 40% | Minimise skill variance within match |
| MatchHistoryScorer | 35% | Avoid repeated player combinations |
| TimeOffCourtScorer | 25% | Prioritise players waiting longest |

### How It Works
1. Get all benched players (active, not currently in a match)
2. Generate candidate foursomes (all combinations or sampled if >12 players)
3. Score each candidate using weighted sum of scorers
4. Select highest-scoring candidate for each available court
5. Return list of MatchCandidate objects with court assignments

### MatchCandidate Model
```csharp
public class MatchCandidate
{
    public int CourtNumber { get; set; }
    public List<Guid> PlayerIds { get; set; }  // 4 players
    public double TotalScore { get; set; }
}
```

---

## 7. UI ARCHITECTURE

### Pages (Routes)
| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Landing page |
| Clubs | `/clubs` | Club list |
| ClubDetails | `/clubs/{ClubId}` | Club info + session history |
| Players | `/clubs/{ClubId}/players` | Player roster |
| Sessions | `/clubs/{ClubId}/sessions` | Session list |
| SessionDraft | `/clubs/{ClubId}/sessions/{SessionId}/draft` | Build roster |
| SessionActive | `/clubs/{ClubId}/sessions/{SessionId}/active` | Live matchmaking |
| SessionComplete | `/clubs/{ClubId}/sessions/{SessionId}/complete` | Results view |

### Key Components
- **MatchCard** - Displays match with 4 players, court number, complete button
- **MatchmakingPanel** - Courts grid + bench + generate FAB
- **BenchDisplay** - Waiting players with games played count
- **CourtDisplay** - Grid of courts (occupied or available)
- **PlayerCard** - Player info with skill badge, gender-coloured avatar
- **MatchPreviewDialog** - Preview matches before creating
- **MatchResultDialog** - Record winner by clicking team
- **MatchEditorDialog** - Swap players in existing match
- **ManualMatchDialog** - Create match from scratch

### State Management (Fluxor)
```
ClubState  → Clubs[], SelectedClub, IsLoading, ErrorMessage
PlayerState → Players[], SelectedPlayer, IsLoading, ErrorMessage
SessionState → CurrentSession, ActiveMatches[], IsLoading, ErrorMessage
```

---

## 8. DATA PERSISTENCE

### IndexedDB Schema (SmashSchedulerDb, v3)
| Store | Key | Indices |
|-------|-----|---------|
| Clubs | id | - |
| Players | id | clubId |
| Sessions | id | clubId |
| Matches | id | sessionId |
| SessionPlayers | composite | sessionId, playerId |
| PlayerBlacklists | id | playerId |

### Repository Pattern
```
IClubRepository → IndexedDbClubRepository
IPlayerRepository → IndexedDbPlayerRepository
ISessionRepository → IndexedDbSessionRepository
IMatchRepository → IndexedDbMatchRepository
```

---

## 9. IMPLEMENTED FEATURES

### Club Management
- [x] Create clubs with name, court count, game type
- [x] View/edit club details
- [x] Delete clubs (cascades to players/sessions)
- [x] View session history table

### Player Management
- [x] Create players with skill (1-10), gender, play style
- [x] Edit player details
- [x] Gender-based avatar colours (pink/blue/grey)
- [x] Skill level badges (red/orange/green gradients)
- [x] Partner/opponent blacklists
- [x] Delete players

### Session Lifecycle
- [x] Create sessions (Draft state)
- [x] Set date/time and court count
- [x] Custom court labels (e.g., "Court 7" instead of "Court 1")
- [x] Add/remove players from roster
- [x] Activate session (Draft → Active)
- [x] Complete session (Active → Complete)

### Matchmaking
- [x] Auto-generate matches for all available courts
- [x] Preview dialog before creating matches
- [x] Single-match generation on empty court tap
- [x] Match history scoring to avoid duplicates
- [x] Time-off-court fairness rotation

### Match Management
- [x] View matches on court grid
- [x] Edit match players (swap from bench)
- [x] Create manual matches
- [x] Record match completion with winning team
- [x] Track automated vs manual matches

### Analytics
- [x] Real-time stats panel (matches, bench count)
- [x] Games played count per player on bench

---

## 10. OUTSTANDING WORK

### High Priority
1. **PWA Support** - Add service worker and manifest for installable app
2. **Session Analytics Page** - Detailed post-session statistics
3. **Historical Analytics** - Cross-session player statistics

### Medium Priority
4. **Score Recording** - Full score tracking (currently just winner)
5. **Data Export** - Export session/player data to CSV/JSON
6. **Undo/Redo** - Undo last match completion or edit

### Low Priority
7. **Dark Mode** - MudBlazor theme switching
8. **Notifications** - Alert when match completes
9. **Sound Effects** - Audio feedback for actions

### Known Issues
1. MudBlazor onBlur console errors (internal MudBlazor issue, v8.15.0)
2. Court numbering display verified correct but investigate if user reports persist

---

## 11. CODING STANDARDS

### Language
- **UK English** exclusively (organise, colour, centre)
- **No comments** in code - self-documenting through naming

### Style
- One class per file
- Primary constructors (C# 12) for DI
- Guard clauses with early returns
- LINQ with line breaks for readability
- 180 character line limit

### Testing
- Run tests after every code change
- Cover new code and edge cases
- 102 tests currently passing (38 unit + 64 component)

### Git
- Always commit and push when work is complete
- Descriptive commit messages
- Co-author attribution for AI assistance

---

## 12. RUNNING THE PROJECT

### Prerequisites
- .NET 10.0 SDK
- Modern browser (Chrome, Edge, Firefox, Safari)

### Commands
```bash
# Run application
cd src/SmashScheduler.Web
dotnet run
# Navigate to https://localhost:5001

# Run tests
dotnet test

# Build for production
dotnet publish src/SmashScheduler.Web -c Release -o release
```

---

## 13. KEY FILES FOR REFERENCE

| File | Purpose |
|------|---------|
| `specs/architecture.md` | Full technical architecture |
| `specs/features.md` | Feature specification |
| `specs/design_system.md` | UI design guidelines |
| `CODING_STANDARDS.md` | Code style rules |
| `CLAUDE.md` | AI agent instructions |
| `src/SmashScheduler.Web/Program.cs` | Application entry point |
| `src/SmashScheduler.Application/Services/Matchmaking/MatchmakingService.cs` | Core algorithm |

---

## 14. RECENT CHANGES (Latest Commit)

**Commit**: `1b83fb4` - Implement observed issues fixes across UI and matchmaking

Changes made:
- Club card: Fixed View Club button navigation
- Player avatars: Added gender-based colours
- Session draft: Added date/time pickers and custom court labels
- Bench display: Shows games played count per player
- Club details: Added session history table with navigation
- Matchmaking: Added MatchHistoryScorer for duplicate prevention
- Matchmaking: Added preview dialog before batch generation
- Matchmaking: Auto-generate match on empty court tap
- Court display: Support for custom court labels
- Updated scorer interface to use MatchScoringContext
- Fixed all tests (102 passing)

---

## 15. CONTINUATION GUIDANCE

When picking up this project:

1. **Read the specs** - `specs/features.md` and `specs/architecture.md` provide complete context
2. **Run tests first** - `dotnet test` should show 102 passing tests
3. **Check CODING_STANDARDS.md** - UK spelling, no comments, one class per file
4. **Use Fluxor pattern** - Actions → Reducers → Effects for state changes
5. **Test after changes** - Always verify tests pass before committing

### Suggested Next Steps
1. Implement PWA support (service worker, manifest)
2. Build session analytics page
3. Add historical player statistics
4. Implement score recording

---

*Document generated: 2026-02-05*
*Project version: Latest main branch*
*Test coverage: 102 tests passing*
