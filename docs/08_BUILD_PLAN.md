# Project LND Build Plan

This document is the **architecture and platform roadmap**. It is intentionally separate from the consumer MVP and validation roadmap in `docs/product/mvp-validation-framework.md`.

## Phase 0: Understand

- Read the existing application end to end.
- Map data flow.
- Identify Notre Dame-specific assumptions.
- Identify reusable UI/application logic.
- Identify provider-specific logic.
- Preserve the working Irish Watch product as the baseline.

## Phase 1: Establish the First TeamOS Boundary

Create the first clear separation between team-specific identity/configuration and generic application/platform behavior.

### Milestone 1A: Extract Notre Dame Team Identity / Configuration

- Introduce a dedicated Notre Dame team configuration.
- Move appropriate team identity and external identifiers out of generic application logic.
- Have the existing Irish Watch experience consume that configuration.
- Preserve existing product behavior, PWA/offline behavior, accessibility, responsive behavior, and integrations.
- Do not attempt to complete TeamOS or build a speculative multi-team runtime in this milestone.

`TEAM_CONFIG` / team configuration is an initial configuration mechanism, not TeamOS itself.

## Phase 2: Establish Team Model

Create the smallest useful TeamOS model and validate it against Notre Dame.

The Team model should distinguish reusable team/domain concepts from simple configuration values and provide a foundation for future team implementations without prematurely modeling every possible capability.

## Phase 3: Establish Normalized Data

Move at least one major external data path behind an adapter/domain boundary.

A good first candidate is schedule/game data.

Provider-specific schemas and behavior should remain outside Suite.

## Phase 4: Rebuild Suite on TeamOS Abstractions

Irish Watch should consume the new TeamOS/team model and normalized data without changing the user's core experience.

This phase establishes the intended relationship:

```text
External Sources
      ↓
    TeamOS
      ↓
Normalized Domain Model
      ↓
    Suite
      ↓
Irish Watch
```

Status: **complete for ESPN** as of 4C. Milestones 4A (league view: `LeagueGame`, `Poll`), 4B (Game Center: `GameDetail`, `SeasonStat`) and 4C (news: `NewsItem`) moved every ESPN payload the Suite consumes behind `teamos/espn.js`; `app.js` no longer carries an ESPN URL, id or key name. A 4D milestone for the two remaining small providers — Kalshi odds (`Market`) and the Open-Meteo forecast (`Forecast`) — is defined but deferred until a concrete product or architectural reason calls for it.

## Phase 5: Add Ohio State

Add Ohio State using configuration and the same Suite/application code.

This is the most important architectural proof point: determine whether the abstractions genuinely generalize without copying the application.

Use the second-team implementation to identify what belongs in TeamOS, what belongs in Suite, and what was unnecessarily abstracted.

## Phase 6: Extract Team Identity / Theme

Once the team model works, make branding and identity team-driven instead of hard-coded Notre Dame styling.

## Phase 7: Team Selection

Allow a user to select a team and instantiate the corresponding Suite.

## Phase 8: My Teams

Support multiple followed teams and personalized cross-team experiences.

## Phase 9: Expand Sports

Validate the domain model against additional sports and leagues. Add sport-specific capabilities only where needed.

## Parallel Product Track

Platform architecture does not determine consumer scope by itself. Product work should run in parallel:

1. Define the target fan and problem.
2. Map the fan experience across game day and between games.
3. Define the Suite product blueprint.
4. Define the consumer MVP.
5. Test the first validation hypothesis.
6. Use evidence to determine what should be built next.

The architecture roadmap should support validated product needs rather than becoming an end in itself.

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
10. Product decisions that affect architecture are documented in the product/decision records.

## Guardrails

- Do not rewrite everything.
- Do not introduce a framework without a concrete need.
- Do not add a backend prematurely.
- Do not build every sport at once.
- Do not create abstractions without a second use case.
- Do not break working features for architectural purity.
- Do not put provider-specific logic in Suite.
- Do not build speculative platform capabilities before a fan need or second use case justifies them.
- Keep `main` stable and Irish Watch-focused.
