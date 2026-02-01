# Project Protocol: Agentic Dev Lab

## Core Constraints
- **Language**: English
- **Spelling**: Use English (UK) exclusively (e.g., 'optimise', 'colour', 'centre').
- **Comments**: NEVER include comments in generated code. Code must be self-documenting and apply SOLID principals.
- **Verification**: Always run tests after any code change and ensure new code & edge cases are covered by tests.

## Multi-Agent Workflow
1. **PM**: Refines `GOAL.md` into `specs/features.md`.
2. **Architect**: Creates `specs/architecture.md` from features.
3. **Critic**: Must review all `specs/` files for UK spelling and "No Comment" violations.
4. **Coder**: Implements code only after Critic approves.