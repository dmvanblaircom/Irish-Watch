# Project LND Build Plan

## Phase 0: Understand

- Read the existing application end to end.
- Map data flow.
- Identify Notre Dame-specific assumptions.
- Identify reusable UI/application logic.
- Identify provider-specific logic.

## Phase 1: Establish Boundaries

- Introduce a clear team/domain boundary.
- Define normalized domain concepts.
- Keep existing behavior working.

## Phase 2: Extract Notre Dame Configuration

Move team identity, external IDs, capabilities, and structured team metadata out of generic application logic.

## Phase 3: Establish Team Model

Create the smallest useful TeamOS model and validate it against Notre Dame.

## Phase 4: Establish Normalized Data

Move at least one major external data path behind an adapter/domain boundary.

A good first candidate is schedule/game data.

## Phase 5: Rebuild Irish Watch on Team Configuration

Irish Watch should consume the new TeamOS/team configuration without changing the user's core experience.

## Phase 6: Add Ohio State

Add Ohio State using configuration and the same Suite/application code.

This is the most important architectural proof point.

## Phase 7: Extract Team Identity / Theme

Once the team model works, make branding and identity team-driven instead of hard-coded Notre Dame styling.

## Phase 8: Team Selection

Allow a user to select a team and instantiate the corresponding Suite.

## Phase 9: My Teams

Support multiple followed teams and personalized cross-team experiences.

## Phase 10: Expand Sports

Validate the domain model against additional sports and leagues. Add sport-specific capabilities only where needed.

## Definition of Done

The foundation work is complete when:

1. Irish Watch continues to work.
2. Notre Dame configuration is separated from generic behavior.
3. A normalized TeamOS model exists.
4. At least one major external data path is behind a domain/provider boundary.
5. Suite consumes normalized data.
6. Ohio State can be added without copying the application.
7. Existing checks pass.
8. PWA/offline behavior remains intact.
9. Accessibility and responsive behavior remain intact.

## Guardrails

- Do not rewrite everything.
- Do not introduce a framework without a concrete need.
- Do not add a backend prematurely.
- Do not build every sport at once.
- Do not create abstractions without a second use case.
- Do not break working features for architectural purity.
- Do not put provider-specific logic in Suite.
