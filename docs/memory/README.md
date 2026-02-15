# SmashScheduler Documentation

This directory contains technical documentation for AI agents working on the SmashScheduler codebase.

## Files Overview

1. **[quick-reference.md](quick-reference.md)** - Start here! 
   - Command cheatsheet
   - Common patterns
   - Code templates
   - Do's and don'ts

2. **[architecture.md](architecture.md)** - High-level system design
   - Tech stack
   - Project structure
   - Server vs Client components
   - Routing conventions

3. **[database-schema.md](database-schema.md)** - Database reference
   - All tables and columns
   - Relationships and constraints
   - RLS policies
   - IndexedDB cache schema

4. **[offline-sync.md](offline-sync.md)** - Offline functionality
   - How the sync system works
   - Implementing offline support
   - IndexedDB operations
   - Common issues

5. **[authentication.md](authentication.md)** - Auth system
   - Supabase client types
   - Auth flow
   - RLS patterns
   - Stripe integration

6. **[components-styling.md](components-styling.md)** - UI development
   - shadcn/ui usage
   - Tailwind patterns
   - Component conventions
   - Design principles

7. **[routing.md](routing.md)** - URL structure
   - Route organization
   - Dynamic segments
   - Guards and middleware
   - Navigation patterns

8. **[patterns-pitfalls.md](patterns-pitfalls.md)** - Best practices
   - Data fetching patterns
   - Form handling
   - Common mistakes
   - Performance tips

## Quick Start

**New to the codebase?** Read in this order:
1. quick-reference.md
2. architecture.md
3. database-schema.md
4. The specific file for your task

## Key Constraints

1. **UK English spelling** - Use 'optimise', 'colour', 'centre'
2. **No code comments** - Code must be self-documenting
3. **Server Components by default** - Only use "use client" when needed
4. **Offline-first** - All data operations should work offline
5. **RLS enabled** - All database tables have Row Level Security

## Common Tasks

### Adding a new feature
1. Check architecture.md for project structure
2. Review database-schema.md for relevant tables
3. Follow patterns in patterns-pitfalls.md
4. Ensure offline support per offline-sync.md

### Fixing a bug
1. Check patterns-pitfalls.md for common issues
2. Review authentication.md for auth issues
3. Check routing.md for navigation issues

### Adding offline support
1. Read offline-sync.md completely
2. Update IndexedDB schema in db.ts
3. Add cache functions in sync-service.ts
4. Create hook following use-sessions.ts pattern
5. Queue changes in components

### Styling components
1. Use shadcn/ui components from components/ui/
2. Follow components-styling.md guidelines
3. Use Tailwind classes, no arbitrary values
4. Maintain accessibility

## Support

For questions about the codebase, refer to these documents first. They contain the accumulated knowledge of the application's technical design and constraints.

Last updated: 2026-02-14
