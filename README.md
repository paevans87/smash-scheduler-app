# SmashScheduler

A badminton session management and automated matchmaking application built with Blazor WebAssembly. SmashScheduler removes the manual matchmaking burden from club organisers by creating fair, skill-balanced matches whilst respecting player preferences and social dynamics.

## Current Functionality

### Club Management

- **Create clubs** with name, default court count, and game type (Singles/Doubles)
- **View and edit** club details
- **Delete clubs** and all associated data

### Player Management

- **Manage player roster** with name, skill level (1-10), gender, and play-style preference
- **Edit player details** via intuitive dialogs
- **Player blacklist management** - specify partners or opponents to avoid
- **Skill level badges** with visual colour coding

### Session Lifecycle

- **Draft mode** - Create sessions, add players from roster, review attendance
- **Active mode** - Lock roster, run matchmaking, manage matches
- **Complete mode** - Mark sessions as finished, view read-only history

### Automated Matchmaking

- **Skill-balanced algorithm** considering:
  - Level-based gameplay (primary weight)
  - Skill balance across teams
  - Blacklist avoidance (soft constraint)
  - Time off court (fairness rotation)
- **Court capacity enforcement** for Singles (2) and Doubles (4)
- **Bench calculation** with prioritisation for next round

### Manual Match Management

- **Override automated matches** by replacing individual players
- **Create manual matches** from scratch
- **Edit match players** during active sessions

### Match Recording

- **Track match state** (In Progress / Completed)
- **Record match results** with winning team selection
- **Clickable team selection** for easy winner recording

### Real-Time Analytics

- **Session statistics panel** showing:
  - Current match count
  - Players on bench
  - Games played per player

### Data Persistence

- **IndexedDB storage** for offline-capable local persistence
- **Auto-save** session state for crash recovery
- All data stored locally in the browser

### User Interface

- **Material Design 3** via MudBlazor component library
- **Responsive layout** for desktop and mobile
- **Error handling** with user-friendly dialogs
- **Loading states** and progress indicators

## Planned Functionality

### Session Analytics (Post-Session)

- [ ] Total matches played summary
- [ ] Total game time calculation
- [ ] Player participation breakdown
- [ ] Override rate tracking (manual vs automated)

### Historical Analytics

- [ ] Partnership statistics across sessions
- [ ] Win rate tracking with partners
- [ ] Player total games played
- [ ] Average play time per session
- [ ] Skill level distribution across club

### Progressive Web App

- [ ] Service worker for offline caching
- [ ] Web app manifest for installation
- [ ] Installable app experience

### Additional Features

- [ ] Match score recording
- [ ] Data export capabilities

## Technology Stack

| Component | Technology |
|-----------|------------|
| Framework | .NET 10.0, Blazor WebAssembly |
| UI Library | MudBlazor 8.15 (Material Design 3) |
| State Management | Fluxor (Redux-like pattern) |
| Data Persistence | IndexedDB via Blazored.IndexedDB |
| Architecture | Clean Architecture, Repository Pattern |
| Language | C# 12 with Primary Constructors |

## Running the Application

```bash
cd src/SmashScheduler.Web
dotnet run
```

Navigate to `https://localhost:5001` in your browser.

## Running Tests

```bash
dotnet test
```

The test suite includes:
- **38 unit tests** for matchmaking and business logic
- **64 component tests** for UI behaviour (bUnit)

## Project Structure

```
SmashScheduler/
├── src/
│   ├── SmashScheduler.Domain/        # Core entities and enums
│   ├── SmashScheduler.Application/   # Business logic and services
│   ├── SmashScheduler.Infrastructure.Web/  # IndexedDB repositories
│   ├── SmashScheduler.Web/           # Blazor WASM UI
│   └── SmashScheduler.Shared/        # Common utilities
├── tests/
│   ├── SmashScheduler.Tests/         # Unit tests
│   └── SmashScheduler.Web.Tests/     # Component tests
└── specs/
    ├── features.md                   # Feature specification
    ├── architecture.md               # Technical architecture
    └── design_system.md              # UI design guidelines
```

## Coding Standards

- **UK English** spelling exclusively (organiser, colour, centre)
- **No code comments** - self-documenting code with SOLID principles
- **Primary constructors** preferred for dependency injection
- **One class per file** for maintainability

## Licence

TBD
