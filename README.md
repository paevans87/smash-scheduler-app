# SmashScheduler

A specialised club management tool designed to remove the manual effort from running badminton sessions. Empowers club organisers to manage their roster and automate the complex task of fair, skill-based matchmaking.

## Features

- **Club Management**: CRUD operations for clubs with court configuration
- **Player Management**: Manage players with skill levels (1-10), gender, play-style preferences, and blacklists
- **Session Management**: Draft → Active → Complete lifecycle with attendance tracking
- **Automated Matchmaking**: Weighted scoring algorithm considering:
  - Skill balance (40% weight)
  - Play style preference (30% weight)
  - Blacklist avoidance (20% weight)
  - Time off court (10% weight)
- **Manual Override**: Full control to manually adjust match assignments
- **Match Management**: Track matches with optional score recording
- **Analytics**: Session statistics including override rate and player participation

## Technology Stack

- **.NET MAUI** - Cross-platform mobile framework (iOS/Android)
- **C# 12** - Primary language
- **SQLite** - Local database
- **MVVM Pattern** - Clean Architecture with proper separation
- **xUnit** - Unit testing framework

## Project Structure

```
SmashScheduler/
├── src/SmashScheduler/
│   ├── Domain/              # Entities, Enums, Value Objects
│   ├── Infrastructure/      # Database, Repositories
│   ├── Application/         # Services, Business Logic
│   ├── Presentation/        # ViewModels, Views (XAML)
│   └── Common/             # Constants, Extensions
├── tests/SmashScheduler.Tests/
│   ├── Matchmaking/        # Scoring strategy tests
│   └── Services/           # Service layer tests
└── specs/                  # Documentation
    ├── features.md         # Feature specifications
    ├── architecture.md     # System architecture
    └── design_system.md    # UX/UI design system
```

## Getting Started

### Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download/dotnet/10.0)
- .NET MAUI workload

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/paevans87/smash-scheduler.git
   cd smash-scheduler
   ```

2. Install .NET MAUI workload:
   ```bash
   dotnet workload install maui
   ```

3. Restore dependencies:
   ```bash
   dotnet restore
   ```

### Running the App

**Android:**
```bash
cd src/SmashScheduler
dotnet build -t:Run -f net10.0-android
```

**iOS (Mac only):**
```bash
cd src/SmashScheduler
dotnet build -t:Run -f net10.0-ios
```

**Note:** Building for Android or iOS requires the Android SDK or Xcode respectively. The project is multi-targeted to also support `net10.0` for testing and development without platform SDKs.

### Running Tests

```bash
dotnet test --framework net10.0
```

Or for detailed output:
```bash
dotnet test --framework net10.0 --logger "console;verbosity=detailed"
```

## Architecture

SmashScheduler follows Clean Architecture principles with MVVM pattern:

- **Domain Layer**: Core business entities and enums
- **Infrastructure Layer**: Data access with SQLite and Repository pattern
- **Application Layer**: Business logic and services
- **Presentation Layer**: MAUI views and ViewModels

### Key Design Decisions

- **UK English**: All code uses British English spelling (colour, organise, initialise)
- **Zero Comments**: Self-documenting code with clear naming
- **SOLID Principles**: Single responsibility, dependency inversion throughout
- **Async/Await**: All I/O operations are asynchronous

## Matchmaking Algorithm

The matchmaking algorithm uses a weighted composite scoring system:

1. **Skill Balance (40%)**: Minimises skill variance within teams
2. **Play Style Preference (30%)**: Matches Level/Mixed/Open preferences
3. **Blacklist Avoidance (20%)**: Soft constraint reducing score for blacklisted pairings
4. **Time Off Court (10%)**: Prioritises players who have been benched longest

## Testing

The project includes comprehensive unit tests covering:

- ✅ All 4 scoring strategies
- ✅ Service layer (Club, Player, SessionState)
- ✅ Business logic validation
- ✅ Edge cases and error handling

Test coverage focuses on critical matchmaking logic and state management.

## Design System

- **Primary Colour**: #2ECC71 (Badminton Green)
- **Accent Colour**: #3498DB (Court Blue)
- **Typography**: System fonts (SF Pro/Roboto)
- **Spacing**: 4pt base unit
- **Touch Targets**: 44×44pt minimum

See `specs/design_system.md` for complete design specifications.

## Project Statistics

- **106 files**
- **~9,300 lines of code**
- **6 Enums**
- **6 Entities**
- **4 Repositories**
- **8 Services**
- **14 ViewModels**
- **12 Views**
- **18 Unit Tests**

## Contributing

This project was developed following strict coding standards:

1. UK English spelling exclusively
2. No code comments (self-documenting code)
3. SOLID principles
4. Mandatory braces for all control structures
5. Guard clauses with early returns

## License

[Add license information]

## Acknowledgements

Built with assistance from Claude Sonnet 4.5

---

**SmashScheduler** - Automating badminton session management with intelligent, fair matchmaking.
