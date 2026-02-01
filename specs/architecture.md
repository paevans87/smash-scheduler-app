# SmashScheduler Architecture Specification

## Technology Stack

### Core Framework
- **.NET MAUI** - Cross-platform mobile application framework (iOS/Android)
- **C# 12** - Primary programming language
- **SQLite** - Local relational database for data persistence

### Additional Libraries
- **SQLite-net-pcl** - SQLite ORM for .NET
- **CommunityToolkit.Mvvm** - MVVM helper library (INotifyPropertyChanged, RelayCommand)
- **CommunityToolkit.Maui** - Enhanced MAUI controls and behaviours

---

## Architecture Pattern

### MVVM with Clean Architecture Principles

**Layers** (outer to inner):
1. **Presentation Layer** - Views (XAML) and ViewModels
2. **Application Layer** - Services and business logic
3. **Domain Layer** - Entities and domain models
4. **Infrastructure Layer** - Data access and persistence

**Key Principles**:
- Dependency inversion (inner layers have no knowledge of outer layers)
- Single responsibility per class
- Interface-driven design for testability
- Repository pattern for data access abstraction

---

## Directory Structure

```
SmashScheduler/
├── Domain/
│   ├── Entities/
│   │   ├── Club.cs
│   │   ├── Player.cs
│   │   ├── Session.cs
│   │   ├── Match.cs
│   │   ├── PlayerBlacklist.cs
│   │   └── SessionPlayer.cs
│   ├── Enums/
│   │   ├── GameType.cs
│   │   ├── SessionState.cs
│   │   ├── MatchState.cs
│   │   ├── PlayStylePreference.cs
│   │   └── Gender.cs
│   └── ValueObjects/
│       ├── MatchScore.cs
│       └── SkillLevel.cs
│
├── Infrastructure/
│   ├── Data/
│   │   ├── SmashSchedulerDbContext.cs
│   │   ├── Repositories/
│   │   │   ├── IClubRepository.cs
│   │   │   ├── ClubRepository.cs
│   │   │   ├── IPlayerRepository.cs
│   │   │   ├── PlayerRepository.cs
│   │   │   ├── ISessionRepository.cs
│   │   │   ├── SessionRepository.cs
│   │   │   ├── IMatchRepository.cs
│   │   │   └── MatchRepository.cs
│   │   └── Migrations/
│   │       └── InitialSchema.cs
│   └── Persistence/
│       └── DatabaseInitialiser.cs
│
├── Application/
│   ├── Services/
│   │   ├── Matchmaking/
│   │   │   ├── IMatchmakingService.cs
│   │   │   ├── MatchmakingService.cs
│   │   │   ├── ScoringStrategies/
│   │   │   │   ├── IMatchScorer.cs
│   │   │   │   ├── SkillBalanceScorer.cs
│   │   │   │   ├── BlacklistAvoidanceScorer.cs
│   │   │   │   ├── TimeOffCourtScorer.cs
│   │   │   │   └── PlayStylePreferenceScorer.cs
│   │   │   └── Models/
│   │   │       ├── MatchCandidate.cs
│   │   │       └── MatchScore.cs
│   │   ├── ClubManagement/
│   │   │   ├── IClubService.cs
│   │   │   └── ClubService.cs
│   │   ├── PlayerManagement/
│   │   │   ├── IPlayerService.cs
│   │   │   └── PlayerService.cs
│   │   ├── SessionManagement/
│   │   │   ├── ISessionService.cs
│   │   │   ├── SessionService.cs
│   │   │   ├── ISessionStateManager.cs
│   │   │   └── SessionStateManager.cs
│   │   ├── MatchManagement/
│   │   │   ├── IMatchService.cs
│   │   │   └── MatchService.cs
│   │   └── Analytics/
│   │       ├── IAnalyticsService.cs
│   │       ├── AnalyticsService.cs
│   │       └── Models/
│   │           ├── SessionStatistics.cs
│   │           └── PlayerStatistics.cs
│   └── Interfaces/
│       └── INavigationService.cs
│
├── Presentation/
│   ├── Views/
│   │   ├── Club/
│   │   │   ├── ClubListPage.xaml
│   │   │   ├── ClubDetailPage.xaml
│   │   │   └── ClubEditPage.xaml
│   │   ├── Player/
│   │   │   ├── PlayerListPage.xaml
│   │   │   ├── PlayerDetailPage.xaml
│   │   │   └── PlayerEditPage.xaml
│   │   ├── Session/
│   │   │   ├── SessionListPage.xaml
│   │   │   ├── SessionDetailPage.xaml
│   │   │   ├── SessionDraftPage.xaml
│   │   │   └── SessionActivePage.xaml
│   │   ├── Match/
│   │   │   ├── MatchmakingPage.xaml
│   │   │   └── MatchDetailPage.xaml
│   │   └── Analytics/
│   │       ├── SessionAnalyticsPage.xaml
│   │       └── PlayerAnalyticsPage.xaml
│   ├── ViewModels/
│   │   ├── Club/
│   │   │   ├── ClubListViewModel.cs
│   │   │   ├── ClubDetailViewModel.cs
│   │   │   └── ClubEditViewModel.cs
│   │   ├── Player/
│   │   │   ├── PlayerListViewModel.cs
│   │   │   ├── PlayerDetailViewModel.cs
│   │   │   └── PlayerEditViewModel.cs
│   │   ├── Session/
│   │   │   ├── SessionListViewModel.cs
│   │   │   ├── SessionDetailViewModel.cs
│   │   │   ├── SessionDraftViewModel.cs
│   │   │   └── SessionActiveViewModel.cs
│   │   ├── Match/
│   │   │   ├── MatchmakingViewModel.cs
│   │   │   └── MatchDetailViewModel.cs
│   │   └── Analytics/
│   │       ├── SessionAnalyticsViewModel.cs
│   │       └── PlayerAnalyticsViewModel.cs
│   ├── Controls/
│   │   ├── PlayerCard.xaml
│   │   ├── MatchCard.xaml
│   │   └── CourtDisplay.xaml
│   └── Converters/
│       ├── SessionStateToColourConverter.cs
│       └── SkillLevelToColourConverter.cs
│
├── Common/
│   ├── Constants/
│   │   └── AppConstants.cs
│   └── Extensions/
│       ├── CollectionExtensions.cs
│       └── EnumExtensions.cs
│
└── App.xaml.cs
```

---

## Data Structures and Associations

### Entity Relationship Model

```
Club (1) ──────< (∞) Player
  │
  └──────< (∞) Session (1) ──────< (∞) SessionPlayer (∞) ──────> (1) Player
                   │
                   └──────< (∞) Match (∞) ──────> (∞) Player (via join table)

Player (1) ──────< (∞) PlayerBlacklist (∞) ──────> (1) Player
```

### Entity Definitions

#### Club
```csharp
Properties:
- Id: Guid (Primary Key)
- Name: string
- DefaultCourtCount: int
- GameType: GameType enum (Singles/Doubles)
- CreatedAt: DateTime
- UpdatedAt: DateTime

Navigation Properties:
- Players: Collection<Player>
- Sessions: Collection<Session>
```

#### Player
```csharp
Properties:
- Id: Guid (Primary Key)
- ClubId: Guid (Foreign Key)
- Name: string
- SkillLevel: int (1-10)
- Gender: Gender enum
- PlayStylePreference: PlayStylePreference enum
- CreatedAt: DateTime
- UpdatedAt: DateTime

Navigation Properties:
- Club: Club
- PartnerBlacklist: Collection<PlayerBlacklist>
- OpponentBlacklist: Collection<PlayerBlacklist>
- SessionPlayers: Collection<SessionPlayer>
```

#### Session
```csharp
Properties:
- Id: Guid (Primary Key)
- ClubId: Guid (Foreign Key)
- ScheduledDateTime: DateTime
- CourtCount: int
- State: SessionState enum (Draft/Active/Complete)
- CreatedAt: DateTime
- UpdatedAt: DateTime

Navigation Properties:
- Club: Club
- SessionPlayers: Collection<SessionPlayer>
- Matches: Collection<Match>

Computed Properties:
- BenchedPlayers: IEnumerable<Player>
- ActivePlayers: IEnumerable<Player>
```

#### SessionPlayer (Join Table)
```csharp
Properties:
- SessionId: Guid (Foreign Key, Composite Primary Key)
- PlayerId: Guid (Foreign Key, Composite Primary Key)
- IsActive: bool
- JoinedAt: DateTime

Navigation Properties:
- Session: Session
- Player: Player
```

#### Match
```csharp
Properties:
- Id: Guid (Primary Key)
- SessionId: Guid (Foreign Key)
- CourtNumber: int
- State: MatchState enum (InProgress/Completed)
- WasAutomated: bool
- StartedAt: DateTime
- CompletedAt: DateTime?
- Score: MatchScore? (Value Object)

Navigation Properties:
- Session: Session
- Players: Collection<Player> (via MatchPlayer join table)
- WinningPlayers: Collection<Player>?
```

#### PlayerBlacklist
```csharp
Properties:
- PlayerId: Guid (Foreign Key, Composite Primary Key)
- BlacklistedPlayerId: Guid (Foreign Key, Composite Primary Key)
- BlacklistType: BlacklistType enum (Partner/Opponent)
- CreatedAt: DateTime

Navigation Properties:
- Player: Player
- BlacklistedPlayer: Player
```

---

## Data Flow Architecture

### Session Lifecycle Flow

```
1. Draft Creation
   UI → SessionDraftViewModel → SessionService → SessionRepository → SQLite

2. Player Addition
   UI → SessionDraftViewModel → SessionService → PlayerRepository → SQLite

3. Activation
   UI → SessionDraftViewModel → SessionStateManager → SessionRepository → SQLite

4. Matchmaking
   UI → MatchmakingViewModel → MatchmakingService
                              ↓
                    Calculate weighted scores
                    (SkillBalanceScorer, BlacklistAvoidanceScorer, etc.)
                              ↓
                    Generate optimal assignments
                              ↓
                    MatchService → MatchRepository → SQLite

5. Match Completion
   UI → MatchDetailViewModel → MatchService → MatchRepository → SQLite
                                             ↓
                              Update SessionPlayer bench status

6. Session Completion
   UI → SessionActiveViewModel → SessionStateManager → SessionRepository → SQLite
                                                      ↓
                                        Calculate session statistics
```

### Data Persistence Strategy

**Write Operations**:
- All create/update/delete operations go through repository interfaces
- Repositories handle SQLite transactions for data integrity
- Crash recovery: Auto-save on every state change

**Read Operations**:
- ViewModels query repositories directly for display data
- Repositories return domain entities, not DTOs
- Use eager loading for navigation properties when needed

---

## State Management

### Application State
- **Current Club**: Singleton service tracking active club context
- **Active Session**: Singleton service tracking currently active session
- **Navigation Stack**: Shell-based navigation with route parameters

### Session State Transitions
```
Draft ──[Activate]──> Active ──[Complete]──> Complete
  │                      │
  └─[Delete]             └─[Mark Player Inactive]
                         └─[Generate Matches]
                         └─[Complete Match]
```

### UI State Synchronisation
- ViewModels implement `INotifyPropertyChanged` via `ObservableObject`
- Use `ObservableCollection` for dynamic lists
- Broadcast events for cross-page state updates (e.g., match completion updates bench)

---

## Matchmaking Algorithm Design

### Strategy Pattern Implementation

**Interface**: `IMatchScorer`
```csharp
double CalculateScore(MatchCandidate candidate, IEnumerable<Player> availablePlayers);
```

**Concrete Scorers** (each returns 0-100):
1. **SkillBalanceScorer** (Weight: 40%)
   - Measures skill variance within teams
   - Lower variance = higher score

2. **PlayStylePreferenceScorer** (Weight: 30%)
   - Level gameplay preference matching
   - Mixed/Open preferences consideration

3. **BlacklistAvoidanceScorer** (Weight: 20%)
   - Penalty for blacklisted pairings
   - Soft constraint (reduces score, doesn't block)

4. **TimeOffCourtScorer** (Weight: 10%)
   - Prioritises players who have been benched longest
   - Tracks time since last match completion

**Composite Score**:
```
Total Score = (SkillBalance × 0.4) + (PlayStyle × 0.3) + (Blacklist × 0.2) + (TimeOff × 0.1)
```

**Algorithm Flow**:
1. Generate all possible match combinations for available players
2. Score each combination using composite scorer
3. Select highest-scoring combination that fills courts optimally
4. Handle remainder players (bench) based on lowest time-off penalty

---

## Database Schema

### SQLite Tables

**Clubs**
- Id (GUID, PK)
- Name (TEXT, NOT NULL)
- DefaultCourtCount (INTEGER, NOT NULL)
- GameType (INTEGER, NOT NULL)
- CreatedAt (TEXT, NOT NULL)
- UpdatedAt (TEXT, NOT NULL)

**Players**
- Id (GUID, PK)
- ClubId (GUID, FK → Clubs.Id)
- Name (TEXT, NOT NULL)
- SkillLevel (INTEGER, NOT NULL, CHECK 1-10)
- Gender (INTEGER, NOT NULL)
- PlayStylePreference (INTEGER, NOT NULL)
- CreatedAt (TEXT, NOT NULL)
- UpdatedAt (TEXT, NOT NULL)

**Sessions**
- Id (GUID, PK)
- ClubId (GUID, FK → Clubs.Id)
- ScheduledDateTime (TEXT, NOT NULL)
- CourtCount (INTEGER, NOT NULL)
- State (INTEGER, NOT NULL)
- CreatedAt (TEXT, NOT NULL)
- UpdatedAt (TEXT, NOT NULL)

**SessionPlayers**
- SessionId (GUID, PK, FK → Sessions.Id)
- PlayerId (GUID, PK, FK → Players.Id)
- IsActive (INTEGER, NOT NULL)
- JoinedAt (TEXT, NOT NULL)

**Matches**
- Id (GUID, PK)
- SessionId (GUID, FK → Sessions.Id)
- CourtNumber (INTEGER, NOT NULL)
- State (INTEGER, NOT NULL)
- WasAutomated (INTEGER, NOT NULL)
- StartedAt (TEXT, NOT NULL)
- CompletedAt (TEXT, NULL)
- Score (TEXT, NULL, JSON)

**MatchPlayers**
- MatchId (GUID, PK, FK → Matches.Id)
- PlayerId (GUID, PK, FK → Players.Id)
- IsWinner (INTEGER, NULL)

**PlayerBlacklists**
- PlayerId (GUID, PK, FK → Players.Id)
- BlacklistedPlayerId (GUID, PK, FK → Players.Id)
- BlacklistType (INTEGER, NOT NULL)
- CreatedAt (TEXT, NOT NULL)

**Indices**:
- ClubId on Players, Sessions
- SessionId on Matches, SessionPlayers
- State on Sessions, Matches

---

## Navigation Architecture

### Shell-Based Navigation
Use .NET MAUI Shell for application structure:

**Routes**:
```
//clubs
//clubs/{clubId}
//clubs/{clubId}/edit
//clubs/{clubId}/players
//clubs/{clubId}/players/{playerId}
//clubs/{clubId}/sessions
//clubs/{clubId}/sessions/{sessionId}
//clubs/{clubId}/sessions/{sessionId}/matchmaking
```

**Navigation Parameters**:
- Pass entity IDs via route parameters
- ViewModels reconstruct entities from repositories
- Use query parameters for optional flags (e.g., `?mode=edit`)

---

## Error Handling Strategy

### Validation Layer
- Input validation in ViewModels before service calls
- Domain validation in service layer (business rules)
- Data integrity validation in repository layer (constraints)

### Exception Handling
- Service layer throws domain-specific exceptions
- ViewModels catch exceptions and display user-friendly messages
- Repository layer throws data access exceptions
- Global exception handler for unhandled crashes

### Crash Recovery
- Auto-save session state on every mutation
- On app restart: check for active session
- If found: restore session state and navigate to SessionActivePage

---

## Performance Considerations

### Database Optimisation
- Use indexed queries for frequent lookups (ClubId, SessionId)
- Lazy load navigation properties by default
- Eager load only when displaying related data
- Batch inserts for bulk operations (e.g., adding multiple players)

### UI Responsiveness
- Run matchmaking algorithm on background thread
- Display loading indicator during computation
- Use virtualized lists for large player rosters
- Cache computed values (e.g., bench calculation)

### Memory Management
- Dispose database connections properly
- Weak event subscriptions for cross-page events
- Clear navigation stack when appropriate

---

## Testing Strategy

### Unit Testing
- Service layer business logic (matchmaking algorithm, state transitions)
- Scorer implementations with known inputs/outputs
- Repository CRUD operations (in-memory SQLite)

### Integration Testing
- Full session lifecycle flows
- Database migrations and schema validation
- Navigation flows between pages

### UI Testing
- Critical user journeys (create session → matchmake → complete)
- Form validation behaviour
- State synchronisation across pages

---

## Accessibility and Localisation

### Accessibility
- Semantic markup for screen readers
- Sufficient colour contrast ratios
- Touch target sizes (minimum 44×44 points)
- Keyboard navigation support

### Localisation
- All UI strings in resource files (.resx)
- UK English as primary locale
- Date/time formatting using UK conventions
- Number formatting for scores

---

## Security Considerations

### Data Protection
- No PII encryption required (per requirements)
- SQLite database stored in app sandbox
- No network communication (offline-only)
- No authentication required (single-user app)

### Input Sanitisation
- Validate all user inputs at ViewModel layer
- Parameterised SQL queries (SQLite-net handles this)
- Prevent SQL injection via ORM usage

---

## Build and Deployment

### Platform Targets
- iOS 14.0+
- Android 8.0+ (API 26)

### Configuration
- Debug configuration for development
- Release configuration with optimisations enabled
- No obfuscation required for MVP

### App Distribution
- iOS: TestFlight for beta testing, App Store for production
- Android: Google Play internal testing track, Play Store for production
