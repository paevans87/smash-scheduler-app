# SmashScheduler - Blazor WebAssembly

A badminton session management and matchmaking application built with Blazor WebAssembly.

## Architecture

This project follows Clean Architecture principles with the following layers:

- **Domain** - Core business entities and enums
- **Application** - Business logic and services  
- **Infrastructure.Web** - Browser-based data persistence (in-memory stubs, ready for IndexedDB)
- **Web** - Blazor WebAssembly UI with MudBlazor components
- **Shared** - Common utilities and constants

## Features Implemented

✅ Multi-project solution structure
✅ Clean separation of concerns
✅ Club management (create, list, view details)
✅ Player management (create, list by club)
✅ Navigation flow between features
✅ MudBlazor Material Design UI
✅ Responsive layout

## Running the Application

```bash
cd src/SmashScheduler.Web
dotnet run
```

Navigate to `https://localhost:5001` in your browser.

## Development Status

**Phase 1-3 Complete** (40% done):
- Project restructuring ✅
- Repository pattern with stubs ✅  
- Basic UI components ✅
- Navigation ✅

**Remaining Work**:
- Session management UI
- Match management and matchmaking algorithm integration
- Analytics dashboard
- IndexedDB implementation (replace in-memory stubs)
- Fluxor state management
- PWA configuration
- Testing infrastructure
- Deployment pipeline

## Technology Stack

- .NET 10.0
- Blazor WebAssembly
- MudBlazor 8.15
- Clean Architecture
- Repository Pattern
- Primary Constructors (C# 12)

## Coding Standards

- UK English spelling exclusively
- No code comments (self-documenting code)
- Primary constructors preferred
- One class per file
- SOLID principles

## License

TBD
