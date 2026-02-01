# Coding Standards & Preferences

## 1. Linguistics (UK English)
- **Rule**: All identifiers, strings, and documentation must use British English exclusively.
- **Good**: `optimise`, `colour`, `initialise`.
- **Bad**: `optimize`, `color`, `initialize`.

## 2. Zero-Comment Policy
- **Rule**: No inline, JSDoc, or block comments allowed. Code must be self-documenting through clear naming.

## 3. Structural Preferences: Mandatory Braces
- **Rule**: Always use curly braces for conditional and loop blocks, even for single-line statements.
- **Bad**:
  if (!user || !user.active) return false;
- **Good**:
  if (!user || !user.active) {
    return false;
  }

## 4. Guard Clauses & Early Returns
- **Rule**: Use the "guard clause" pattern to handle errors/exceptions at the top of functions.
- **Rule**: Every guard clause must follow the Mandatory Braces rule (multiline).
- **Good**:
  if (isMissingData) {
    return null;
  }

## 5. Critic Agent Enforcement
The **Critic** must reject code that:
1. Omits curly braces `{}` for any `if`, `else`, `for`, or `while` statement.
2. Uses US English spelling.
3. Contains any comments (except for explicit `TODO` items requested by Architect).

## 6. Architecture: SOLID Principles
- **Single Responsibility (SRP)**: Each class must have one reason to change. If a class handles logic and I/O, the Critic must reject it.
- **Dependency Inversion (DIP)**: High-level modules must not depend on low-level modules. Use interfaces for all dependencies.

## 7. Testing & Quality Assurance
- **Rule**: Every new feature requires a corresponding unit test file.
- **Edge Cases**: Tests must cover null inputs, empty strings, and out-of-range values.
- **Workflow**: The Coder is responsible for executing `dotnet test` and ensuring 100% pass rate before finishing.

## 8. C# Specifics: Records vs Classes
- **Rule**: Use `record` for Data Transfer Objects (DTOs), API responses, and immutable state.
- **Rule**: Use `class` only when managing complex behavior, internal state mutation, or where reference equality is required.
- **Example**: `public record UserDto(string FullName, string Email);`

## 9. API Design: RESTful Standards
- **Rule**: APIs must follow standard REST patterns (nouns for resources, plural paths, correct HTTP verbs).
- **Exceptions**: Only the Architect can override this (e.g., for GraphQL or WebSockets) in `specs/architecture.md`.

## 10. Security First
- **Rule**: NO code should introduce potential attack vectors.
- **Exceptions**: NONE