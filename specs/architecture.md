# SmashScheduler Architecture Specification

## Executive Summary

**Platform**: Blazor WebAssembly (WASM) - Standalone Progressive Web App
**Justification**: Blazor WASM is optimal for SmashScheduler due to offline-first requirements, no backend infrastructure needs, cross-platform browser compatibility, and ability to reuse existing C# business logic whilst providing a modern web SPA experience.

---

## Technology Stack

### Core Framework
- **Blazor WebAssembly** (.NET 9.0) - Client-side SPA running in browser via WebAssembly
- **C# 12** - Primary programming language
- **Razor Components** - UI component model

### Data Persistence
- **Blazored.LocalStorage** - Simple key-value storage for settings and preferences
- **Blazored.IndexedDB** - Structured database for entities (Clubs, Players, Sessions, Matches)
- **IndexedDB** - Browser-native database with transaction support

### State Management
- **Fluxor** - Redux-like state management for Blazor
- **CascadingParameter** - Component hierarchy state propagation
- **Scoped Services** - Session-specific state management

### UI Component Library
- **MudBlazor** - Material Design 3 component library
  - Modern, attractive UI meeting design requirements
  - Comprehensive component library
  - Excellent responsive design
  - Built-in theming with customisable colour palette
  - Accessibility support (WCAG 2.1 AA)

### PWA Capabilities
- **Service Workers** - Offline caching and asset management
- **Web App Manifest** - Installable app behaviour
- **Cache API** - Static asset caching strategy

### Additional Libraries
- **Blazored.Modal** - Modal dialogue support
- **Blazored.Toast** - Toast notifications for user feedback
- **bUnit** - Component testing framework

---

## Hosting Model Comparison

### Blazor Server (Rejected)
- **Architecture**: Server-side rendering with SignalR connection
- **Why Rejected**: Requires constant internet connection, violates offline-first requirement, needs backend infrastructure

### Blazor WebAssembly (Selected)
- **Architecture**: Client-side SPA running entirely in browser
- **Why Selected**: Fully offline-capable, no backend required, PWA support, local data persistence, cost-effective static hosting

### Blazor United/Auto (Rejected)
- **Architecture**: Hybrid with server-side and client-side rendering
- **Why Rejected**: Still requires backend server, cannot work fully offline, unnecessary complexity

---

## Architecture Pattern

### Component-Based Architecture with Flux Pattern

**Layers** (outer to inner):
1. **Presentation Layer** - Razor Components and Pages
2. **State Layer** - Fluxor stores, actions, reducers, effects
3. **Application Layer** - Services and business logic
4. **Domain Layer** - Entities and domain models
5. **Infrastructure Layer** - IndexedDB repositories and browser storage

**Key Principles**:
- Unidirectional data flow (Flux pattern)
- Dependency inversion (inner layers independent of outer layers)
- Single responsibility per component/service
- Interface-driven design for testability
- Repository pattern for data access abstraction

### Data Flow Pattern

```
User Interaction (Component)
    ↓ Dispatches
Action (Fluxor)
    ↓ Handled by
Reducer (Updates State)
    ↓ Triggers
Effect (Calls Service)
    ↓ Uses
Repository (IndexedDB)
    ↓ Returns Data
Effect (Dispatches Success Action)
    ↓ Updates
State (Immutable)
    ↓ Notifies
Component (Re-renders)
```

---

## Directory Structure

```
SmashScheduler/
├── src/
│   ├── SmashScheduler.Domain/
│   │   ├── Entities/
│   │   │   ├── Club.cs
│   │   │   ├── Player.cs
│   │   │   ├── Session.cs
│   │   │   ├── Match.cs
│   │   │   ├── PlayerBlacklist.cs
│   │   │   └── SessionPlayer.cs
│   │   ├── Enums/
│   │   │   ├── GameType.cs
│   │   │   ├── SessionState.cs
│   │   │   ├── MatchState.cs
│   │   │   ├── PlayStylePreference.cs
│   │   │   ├── Gender.cs
│   │   │   └── BlacklistType.cs
│   │   └── ValueObjects/
│   │       └── MatchScore.cs
│   │
│   ├── SmashScheduler.Application/
│   │   ├── Services/
│   │   │   ├── Matchmaking/
│   │   │   │   ├── IMatchmakingService.cs
│   │   │   │   ├── MatchmakingService.cs
│   │   │   │   ├── ScoringStrategies/
│   │   │   │   │   ├── IMatchScorer.cs
│   │   │   │   │   ├── SkillBalanceScorer.cs
│   │   │   │   │   ├── BlacklistAvoidanceScorer.cs
│   │   │   │   │   ├── TimeOffCourtScorer.cs
│   │   │   │   │   └── PlayStylePreferenceScorer.cs
│   │   │   │   └── Models/
│   │   │   │       └── MatchCandidate.cs
│   │   │   ├── ClubManagement/
│   │   │   │   ├── IClubService.cs
│   │   │   │   └── ClubService.cs
│   │   │   ├── PlayerManagement/
│   │   │   │   ├── IPlayerService.cs
│   │   │   │   └── PlayerService.cs
│   │   │   ├── SessionManagement/
│   │   │   │   ├── ISessionService.cs
│   │   │   │   └── SessionService.cs
│   │   │   ├── MatchManagement/
│   │   │   │   ├── IMatchService.cs
│   │   │   │   └── MatchService.cs
│   │   │   └── Analytics/
│   │   │       ├── IAnalyticsService.cs
│   │   │       └── AnalyticsService.cs
│   │   └── Interfaces/
│   │       └── INavigationService.cs
│   │
│   ├── SmashScheduler.Infrastructure.Web/
│   │   ├── Storage/
│   │   │   ├── IndexedDb/
│   │   │   │   ├── IndexedDbContext.cs
│   │   │   │   ├── IndexedDbInitialiser.cs
│   │   │   │   └── Models/
│   │   │   │       └── DatabaseSchema.cs
│   │   │   └── Repositories/
│   │   │       ├── IClubRepository.cs
│   │   │       ├── ClubRepository.cs
│   │   │       ├── IPlayerRepository.cs
│   │   │       ├── PlayerRepository.cs
│   │   │       ├── ISessionRepository.cs
│   │   │       ├── SessionRepository.cs
│   │   │       ├── IMatchRepository.cs
│   │   │       └── MatchRepository.cs
│   │   └── Services/
│   │       └── BrowserStorageService.cs
│   │
│   ├── SmashScheduler.Web/
│   │   ├── wwwroot/
│   │   │   ├── css/
│   │   │   │   ├── app.css
│   │   │   │   └── mudblazor-overrides.css
│   │   │   ├── js/
│   │   │   │   ├── app.js
│   │   │   │   └── indexedDb.js
│   │   │   ├── images/
│   │   │   │   └── icon-512.png
│   │   │   ├── manifest.json
│   │   │   ├── service-worker.js
│   │   │   └── index.html
│   │   ├── Components/
│   │   │   ├── Layout/
│   │   │   │   ├── MainLayout.razor
│   │   │   │   ├── NavMenu.razor
│   │   │   │   └── TopBar.razor
│   │   │   ├── Shared/
│   │   │   │   ├── PlayerCard.razor
│   │   │   │   ├── MatchCard.razor
│   │   │   │   ├── CourtDisplay.razor
│   │   │   │   ├── SkillLevelBadge.razor
│   │   │   │   ├── SessionStateBadge.razor
│   │   │   │   └── LoadingSpinner.razor
│   │   │   ├── Club/
│   │   │   │   ├── ClubList.razor
│   │   │   │   ├── ClubDetail.razor
│   │   │   │   ├── ClubForm.razor
│   │   │   │   └── ClubCard.razor
│   │   │   ├── Player/
│   │   │   │   ├── PlayerList.razor
│   │   │   │   ├── PlayerDetail.razor
│   │   │   │   ├── PlayerForm.razor
│   │   │   │   ├── PlayerSelector.razor
│   │   │   │   └── BlacklistManager.razor
│   │   │   ├── Session/
│   │   │   │   ├── SessionList.razor
│   │   │   │   ├── SessionDraft.razor
│   │   │   │   ├── SessionActive.razor
│   │   │   │   ├── SessionComplete.razor
│   │   │   │   └── AttendanceChecker.razor
│   │   │   ├── Match/
│   │   │   │   ├── MatchmakingPanel.razor
│   │   │   │   ├── MatchDetail.razor
│   │   │   │   ├── MatchEditor.razor
│   │   │   │   └── BenchDisplay.razor
│   │   │   └── Analytics/
│   │   │       ├── SessionAnalytics.razor
│   │   │       ├── PlayerAnalytics.razor
│   │   │       └── StatisticCard.razor
│   │   ├── Pages/
│   │   │   ├── Index.razor
│   │   │   ├── Clubs/
│   │   │   │   ├── Clubs.razor
│   │   │   │   ├── ClubDetails.razor
│   │   │   │   └── EditClub.razor
│   │   │   ├── Players/
│   │   │   │   ├── Players.razor
│   │   │   │   ├── PlayerDetails.razor
│   │   │   │   └── EditPlayer.razor
│   │   │   ├── Sessions/
│   │   │   │   ├── Sessions.razor
│   │   │   │   ├── CreateSession.razor
│   │   │   │   ├── SessionDetails.razor
│   │   │   │   └── ActiveSession.razor
│   │   │   └── Analytics/
│   │   │       └── Analytics.razor
│   │   ├── State/
│   │   │   ├── Store/
│   │   │   │   ├── SessionStore/
│   │   │   │   │   ├── SessionState.cs
│   │   │   │   │   ├── SessionActions.cs
│   │   │   │   │   ├── SessionReducers.cs
│   │   │   │   │   └── SessionEffects.cs
│   │   │   │   ├── ClubStore/
│   │   │   │   │   ├── ClubState.cs
│   │   │   │   │   ├── ClubActions.cs
│   │   │   │   │   ├── ClubReducers.cs
│   │   │   │   │   └── ClubEffects.cs
│   │   │   │   └── PlayerStore/
│   │   │   │       ├── PlayerState.cs
│   │   │   │       ├── PlayerActions.cs
│   │   │   │       ├── PlayerReducers.cs
│   │   │   │       └── PlayerEffects.cs
│   │   │   └── Features/
│   │   │       └── ActiveSessionFeature.cs
│   │   ├── Services/
│   │   │   ├── NavigationService.cs
│   │   │   ├── ToastService.cs
│   │   │   └── StateInitialisationService.cs
│   │   ├── Program.cs
│   │   └── SmashScheduler.Web.csproj
│   │
│   └── SmashScheduler.Shared/
│       ├── Extensions/
│       │   ├── CollectionExtensions.cs
│       │   └── EnumExtensions.cs
│       └── Constants/
│           └── AppConstants.cs
│
├── tests/
│   ├── SmashScheduler.Tests/
│   │   ├── Matchmaking/
│   │   └── Services/
│   └── SmashScheduler.Web.Tests/
│       ├── Components/
│       └── Integration/
│
└── specs/
    ├── features.md
    ├── architecture.md
    └── design_system.md
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
```
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
```
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
```
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

#### SessionPlayer
```
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
```
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
```
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

## Data Persistence Strategy

### Browser Storage Options

| Storage Type | Capacity | Structured | Async | Offline | Purpose |
|--------------|----------|------------|-------|---------|---------|
| LocalStorage | ~5-10MB | No | No | Yes | Simple settings |
| SessionStorage | ~5-10MB | No | No | Yes | Temporary data |
| **IndexedDB** | ~50MB-1GB+ | Yes | Yes | Yes | **Primary data store** |
| Cache API | ~50MB+ | No | Yes | Yes | Static assets |

### IndexedDB as Primary Storage

**Rationale**:
- Structured data support for complex objects
- Large capacity (sufficient for thousands of players/sessions)
- Transaction support for data integrity
- Indexed queries for performant lookups
- Asynchronous API for non-blocking operations
- Full offline support

### IndexedDB Schema

**Database**: `SmashSchedulerDb`
**Version**: 1

**Object Stores**:

1. **Clubs**
   - keyPath: `id`
   - indices: none

2. **Players**
   - keyPath: `id`
   - indices: `clubId`

3. **Sessions**
   - keyPath: `id`
   - indices: `clubId`, `state`, `scheduledDateTime`

4. **SessionPlayers**
   - keyPath: `[sessionId, playerId]`
   - indices: `sessionId`, `playerId`

5. **Matches**
   - keyPath: `id`
   - indices: `sessionId`, `state`

6. **MatchPlayers**
   - keyPath: `[matchId, playerId]`
   - indices: `matchId`, `playerId`

7. **PlayerBlacklists**
   - keyPath: `[playerId, blacklistedPlayerId]`
   - indices: `playerId`, `blacklistedPlayerId`, `blacklistType`

### Repository Pattern Implementation

Repository interfaces remain unchanged from original architecture. IndexedDB implementations use Blazored.IndexedDB library:

```
public interface IClubRepository
{
    Task<Club?> GetByIdAsync(Guid id);
    Task<IEnumerable<Club>> GetAllAsync();
    Task<Club> AddAsync(Club club);
    Task UpdateAsync(Club club);
    Task DeleteAsync(Guid id);
}

public class ClubRepository : IClubRepository
{
    private readonly IIndexedDbFactory _dbFactory;

    public async Task<Club?> GetByIdAsync(Guid id)
    {
        await using var db = await _dbFactory.Create();
        return await db.GetByIdAsync<Club>("Clubs", id.ToString());
    }

    public async Task<IEnumerable<Club>> GetAllAsync()
    {
        await using var db = await _dbFactory.Create();
        return await db.GetAllAsync<Club>("Clubs");
    }
}
```

---

## State Management Architecture

### Fluxor State Management

**Pattern**: Unidirectional data flow (Redux/Flux pattern)

**Core Concepts**:
- **State**: Immutable state objects
- **Actions**: Events that describe state changes
- **Reducers**: Pure functions that create new state
- **Effects**: Side effects (API calls, repository operations)

### Example: Session State Management

**State Object**:
```
public class SessionState
{
    public Session? CurrentSession { get; init; }
    public IEnumerable<Match> ActiveMatches { get; init; }
    public IEnumerable<Player> BenchedPlayers { get; init; }
    public bool IsLoading { get; init; }
    public string? ErrorMessage { get; init; }
}
```

**Actions**:
```
public record LoadSessionAction(Guid SessionId);
public record LoadSessionSuccessAction(Session Session, IEnumerable<Match> Matches);
public record LoadSessionFailureAction(string Error);
public record GenerateMatchesAction();
public record CompleteMatchAction(Guid MatchId);
```

**Reducer**:
```
public static class SessionReducers
{
    [ReducerMethod]
    public static SessionState ReduceLoadSessionAction(SessionState state, LoadSessionAction action)
    {
        return state with { IsLoading = true, ErrorMessage = null };
    }

    [ReducerMethod]
    public static SessionState ReduceLoadSessionSuccessAction(
        SessionState state,
        LoadSessionSuccessAction action)
    {
        return state with
        {
            CurrentSession = action.Session,
            ActiveMatches = action.Matches,
            IsLoading = false
        };
    }
}
```

**Effect**:
```
public class SessionEffects
{
    private readonly ISessionRepository _sessionRepository;
    private readonly IMatchRepository _matchRepository;

    [EffectMethod]
    public async Task HandleLoadSessionAction(LoadSessionAction action, IDispatcher dispatcher)
    {
        try
        {
            var session = await _sessionRepository.GetByIdAsync(action.SessionId);
            var matches = await _matchRepository.GetBySessionIdAsync(action.SessionId);

            dispatcher.Dispatch(new LoadSessionSuccessAction(session, matches));
        }
        catch (Exception ex)
        {
            dispatcher.Dispatch(new LoadSessionFailureAction(ex.Message));
        }
    }
}
```

### Application State Structure

```
Root State
├── ClubState
│   ├── Clubs: Collection<Club>
│   ├── SelectedClub: Club?
│   └── IsLoading: bool
├── PlayerState
│   ├── Players: Collection<Player>
│   ├── SelectedPlayer: Player?
│   └── IsLoading: bool
├── SessionState
│   ├── CurrentSession: Session?
│   ├── ActiveMatches: Collection<Match>
│   ├── BenchedPlayers: Collection<Player>
│   └── IsLoading: bool
└── UIState
    ├── IsDrawerOpen: bool
    ├── Theme: ThemeSettings
    └── ToastMessages: Queue<ToastMessage>
```

---

## Component Architecture

### Component Hierarchy

**Page Components** (Route targets):
- Contain route parameters
- Dispatch actions on load
- Compose multiple child components
- Subscribe to Fluxor state

**Feature Components** (Complex UI sections):
- Self-contained functionality
- Accept parameters from parent
- Emit events to parent
- Can dispatch actions directly

**Shared Components** (Reusable UI elements):
- Pure presentation components
- Accept all data via parameters
- Emit events for user interactions
- No direct state access

### Example Component Structure

```
ActiveSession.razor (Page)
    ├── SessionStateBadge.razor (Shared)
    ├── MatchmakingPanel.razor (Feature)
    │   ├── BenchDisplay.razor (Feature)
    │   │   └── PlayerCard.razor (Shared)
    │   └── MatchCard.razor (Shared)
    │       └── SkillLevelBadge.razor (Shared)
    └── CourtDisplay.razor (Feature)
        └── MatchCard.razor (Shared)
```

### Component Communication Patterns

**Parent → Child**: Parameters
```
<MatchCard Match="@match" CourtNumber="1" />
```

**Child → Parent**: EventCallback
```
<MatchCard OnComplete="@HandleMatchComplete" />
```

**Cross-Component**: Fluxor State + Actions
```
@inherits FluxorComponent
@inject IState<SessionState> SessionState
@inject IDispatcher Dispatcher

Dispatcher.Dispatch(new CompleteMatchAction(matchId));
```

---

## Navigation Architecture

### Route Configuration

```
/ (Index/Home)
/clubs (Club List)
/clubs/{clubId} (Club Details)
/clubs/{clubId}/edit (Edit Club)
/clubs/{clubId}/players (Player List)
/clubs/{clubId}/players/{playerId} (Player Details)
/clubs/{clubId}/players/{playerId}/edit (Edit Player)
/clubs/{clubId}/sessions (Session List)
/clubs/{clubId}/sessions/create (Create Session)
/clubs/{clubId}/sessions/{sessionId} (Session Details)
/clubs/{clubId}/sessions/{sessionId}/active (Active Session Management)
/clubs/{clubId}/sessions/{sessionId}/analytics (Session Analytics)
/analytics (Historical Analytics)
```

### Navigation Service

```
public interface INavigationService
{
    void NavigateToClub(Guid clubId);
    void NavigateToPlayer(Guid clubId, Guid playerId);
    void NavigateToSession(Guid clubId, Guid sessionId);
    void NavigateToActiveSession(Guid clubId, Guid sessionId);
    void NavigateBack();
}
```

Implementation uses Blazor's `NavigationManager` with route templates.

---

## Matchmaking Algorithm Design

### Strategy Pattern Implementation

**Interface**: `IMatchScorer`

**Concrete Scorers**:

1. **SkillBalanceScorer** (Weight: 40%)
   - Measures skill variance within teams
   - Lower variance produces higher score

2. **PlayStylePreferenceScorer** (Weight: 30%)
   - Matches level gameplay preferences
   - Considers mixed and open preferences

3. **BlacklistAvoidanceScorer** (Weight: 20%)
   - Applies penalty for blacklisted pairings
   - Soft constraint (reduces score, does not block)

4. **TimeOffCourtScorer** (Weight: 10%)
   - Prioritises players benched longest
   - Tracks time since last match completion

**Composite Score**:
```
Total Score = (SkillBalance × 0.4) + (PlayStyle × 0.3) + (Blacklist × 0.2) + (TimeOff × 0.1)
```

**Algorithm Flow**:
1. Generate all possible match combinations for available players
2. Score each combination using composite scorer
3. Select highest-scoring combination that optimally fills courts
4. Handle remainder players (bench) based on lowest time-off penalty

### Background Processing

Matchmaking runs on background thread using `Task.Run()` to prevent UI blocking. Component displays loading indicator during computation.

---

## Progressive Web App Configuration

### Manifest Configuration

```
{
  "name": "SmashScheduler",
  "short_name": "SmashScheduler",
  "description": "Badminton session management and matchmaking",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#FFFFFF",
  "theme_color": "#2ECC71",
  "icons": [
    {
      "src": "images/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

### Service Worker Strategy

- **Cache-first** for app shell (HTML, CSS, JS)
- **Network-first** with IndexedDB fallback for data
- Periodic background sync (if user enables)
- Automatic updates when online

### Installation Experience

1. User visits site in browser
2. Browser prompts "Add to Home Screen"
3. App installs and opens in standalone mode
4. Fully functional offline immediately
5. Updates automatically when online

---

## UI Component Strategy

### MudBlazor Component Mapping

| Feature | MudBlazor Component |
|---------|-------------------|
| Navigation | MudDrawer, MudAppBar |
| Cards | MudCard |
| Lists | MudList, MudListItem |
| Forms | MudTextField, MudSelect, MudSlider |
| Buttons | MudButton, MudFab |
| Modals | MudDialog |
| Notifications | MudSnackbar |
| Loading | MudProgressCircular, MudSkeleton |
| Tables | MudTable |
| Chips | MudChip |

### Custom Components

1. **PlayerCard** - Avatar, name, skill badge
2. **MatchCard** - Court number, 4 player slots, actions
3. **CourtDisplay** - Visual court grid layout
4. **SkillLevelBadge** - Circular badge with gradient colour
5. **SessionStateBadge** - Pill-shaped status indicator
6. **BenchDisplay** - List of players currently benched

---

## Performance Optimisation

### Initial Load Optimisation

**Blazor WASM Configuration**:
```
<PropertyGroup>
  <BlazorWebAssemblyLoadAllGlobalizationData>false</BlazorWebAssemblyLoadAllGlobalizationData>
  <InvariantGlobalization>false</InvariantGlobalization>
  <BlazorEnableTimeZoneSupport>false</BlazorEnableTimeZoneSupport>
  <RunAOTCompilation>true</RunAOTCompilation>
  <PublishTrimmed>true</PublishTrimmed>
</PropertyGroup>
```

**Optimisations**:
- Brotli compression (reduces ~2-3MB to ~800KB)
- Lazy loading assemblies
- AOT compilation for faster execution
- Trimming unused code

### Runtime Performance

**Component Rendering**:
- Use `@key` directive for list items
- Implement `ShouldRender()` for expensive components
- Judicious use of `StateHasChanged()`

**IndexedDB Performance**:
- Batch operations where possible
- Use indices for frequent queries
- Cache frequently accessed data in memory

**Matchmaking Algorithm**:
- Run on background thread
- Display loading indicator
- Cancel operation if user navigates away

---

## Testing Strategy

### Unit Testing

**Existing Tests** (Reusable):
- Matchmaking scoring strategies
- Service layer business logic
- Domain entity behaviour

**New Tests Required**:
- IndexedDB repository operations
- Fluxor reducers (pure functions)
- State transitions

### Component Testing (bUnit)

```
public class MatchCardTests : TestContext
{
    [Fact]
    public void MatchCard_RendersCorrectly()
    {
        var match = new Match
        {
            CourtNumber = 1,
            State = MatchState.InProgress
        };

        var component = RenderComponent<MatchCard>(parameters =>
            parameters.Add(p => p.Match, match));

        component.Find(".court-number").TextContent.Should().Be("Court 1");
        component.Find(".match-state").TextContent.Should().Contain("In Progress");
    }
}
```

### Integration Testing

- Full session lifecycle flows
- IndexedDB CRUD operations
- State management action → reducer → effect flow
- Navigation between pages

### End-to-End Testing (Playwright)

- Complete session workflow (create → draft → active → complete)
- Matchmaking generation and override
- Data persistence across browser refresh

---

## Error Handling Strategy

### Validation Layers

1. **Component Layer**: Input validation before dispatch
2. **Service Layer**: Business rule validation
3. **Repository Layer**: Data integrity validation

### Exception Handling

- Services throw domain-specific exceptions
- Effects catch exceptions and dispatch failure actions
- Components display user-friendly error messages via toast notifications
- Global error boundary for unhandled crashes

### Crash Recovery

- IndexedDB persists session state automatically
- On app restart: check for active session
- If found: restore session state and navigate to active session page

---

## Security Considerations

### Browser Security Model

**Data Protection**:
- IndexedDB is origin-isolated (no cross-site access)
- Same-origin policy enforced by browser
- No server communication (no network attack surface)
- Local data only (no PII transmission)

### Input Sanitisation

- Blazor automatically HTML-encodes output
- Parameterised queries in IndexedDB (via Blazored library)
- Validate all user inputs at component level

### Content Security Policy

```
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self';
               style-src 'self' 'unsafe-inline';
               script-src 'self' 'unsafe-eval';" />
```

---

## Accessibility Strategy

### WCAG 2.1 AA Compliance

**MudBlazor Built-in Features**:
- Semantic HTML elements
- ARIA labels and roles
- Keyboard navigation
- Focus management

**Custom Component Requirements**:
- Minimum touch target: 44×44px
- Colour contrast: 4.5:1 for text
- Focus indicators: 2px border
- Screen reader announcements for dynamic content

**Example**:
```
<MudButton Variant="Variant.Filled"
           Color="Color.Primary"
           AriaLabel="Generate matches for current session"
           OnClick="GenerateMatches">
    <MudIcon Icon="@Icons.Material.Filled.PlayArrow" />
    Generate Matches
</MudButton>
```

---

## Localisation Strategy

### UK English

**Resource Files**:
```
Resources/
├── Localisation.en-GB.resx
└── Localisation.resx (default)
```

**Usage**:
```
@inject IStringLocalizer<Localisation> Localiser

<h1>@Localiser["SessionOrganiser"]</h1>
```

**Date/Time Formatting**:
- UK conventions (dd/MM/yyyy)
- 24-hour time format

**Spelling**:
- organiser, colour, centre, analyse, optimise

---

## Build and Deployment

### Platform Targets

- Modern browsers (Chrome, Firefox, Safari, Edge)
- Desktop, tablet, and mobile browsers
- WebAssembly support required

### Static Hosting Options

- **GitHub Pages** (Recommended)
- Netlify
- Vercel
- Azure Static Web Apps
- Cloudflare Pages

### Deployment Pipeline (GitHub Actions)

```
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - name: Setup .NET
      uses: actions/setup-dotnet@v3
      with:
        dotnet-version: 9.0.x
    - name: Publish
      run: dotnet publish src/SmashScheduler.Web/SmashScheduler.Web.csproj -c Release -o release
    - name: Deploy
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: release/wwwroot
```

---

## Migration from MAUI Architecture

### Reusability Assessment

| Layer | Reuse % | Notes |
|-------|---------|-------|
| Domain | 100% | All entities, enums, value objects reusable as-is |
| Application | 95% | Services reusable with minor async adaptations |
| Infrastructure | 0% | SQLite → IndexedDB (new implementations) |
| Presentation | 0% | XAML → Razor (complete rewrite) |
| **Overall** | **~60%** | **~40% new code required** |

### Migration Effort

**Phase 1: Foundation** (1-2 weeks)
- Create Blazor WASM project structure
- Setup MudBlazor and Fluxor
- Implement IndexedDB context and schema
- Migrate Domain and Application layers

**Phase 2: Core Features** (3-5 weeks)
- Build Club management components
- Build Player management components
- Build Session management (draft/active/complete)
- Implement matchmaking UI integration
- Build match management components

**Phase 3: Polish** (2-3 weeks)
- Implement analytics pages
- Add PWA manifest and service worker
- Apply design system
- Implement error handling and loading states
- Add notifications and modals

**Phase 4: Testing & Deployment** (1-2 weeks)
- Component unit tests
- Integration tests
- End-to-end tests
- Performance optimisation
- Deploy to hosting platform

---

## Success Metrics

### Technical Metrics
- Initial load time: < 3 seconds on 3G connection
- Time to interactive: < 5 seconds
- Lighthouse PWA score: 90+
- Test coverage: > 80% for business logic

### User Experience Metrics
- Works offline: 100% functionality without network
- Mobile responsive: Usable on all screen sizes
- Accessibility: WCAG 2.1 AA compliant
- Cross-browser: Works on all modern browsers
