# Project LND

## Identity

- Project LND = Leave No Doubt. This is the overall product vision.
- TeamOS = the platform/domain intelligence layer. Think of it as the brains.
- Suite = the fan-facing experience. Think of it as the destination.
- Irish Watch = the first team-specific implementation and proof of concept.

## North Star

Build a platform where the team is the center of the experience. A fan should be able to select a team and receive a complete, team-specific destination without a separate codebase for every team.

Core principle: **Notre Dame is data, not code.**

The critical architecture test is:
- Notre Dame configuration -> Irish Watch
- Ohio State configuration -> an Ohio State Suite

If adding Ohio State requires copying the application or scattering team conditionals throughout the code, the architecture boundary is wrong.

## Current State

Irish Watch is a vanilla HTML/CSS/JavaScript PWA using browser APIs, ESPN data, local JSON snapshots, GitHub Actions, Kalshi data, RSS/news sources, a service worker, responsive UI, accessibility features, and automated checks.

The existing app is a strong foundation. Do not rewrite it from scratch.

## How to Work in This Repository

Before making architectural changes:
1. Read this file and the Project LND docs.
2. Inspect the current data flow and identify where external provider schemas enter the application.
3. Identify Notre Dame-specific assumptions.
4. Separate reusable domain behavior from TeamOS concerns and Suite concerns.
5. Preserve existing behavior unless the task explicitly changes product behavior.

Run the existing checks after changes:
- `node --check app.js`
- `node --check sw.js`
- `python3 tools/csscheck.py app.css`

## Architecture Rules

1. Team identity and team-specific behavior belong in configuration/data whenever possible.
2. Do not hard-code team-specific UI behavior into generic Suite components.
3. External provider schemas should be hidden behind adapters/normalization boundaries.
4. TeamOS owns normalized sports-domain data and team intelligence.
5. Suite consumes normalized TeamOS data and owns the fan experience.
6. Sport-specific differences should use capabilities, configuration, or adapters rather than duplicated applications.
7. Do not create separate codebases for individual teams.
8. Prove the Notre Dame -> Ohio State use case before broadening to every sport.
9. Do not introduce infrastructure merely because it might be useful later.
10. Preserve the existing PWA, offline behavior, accessibility, and responsive experience.
11. Do not remove working features during architectural refactoring.
12. Do not put provider-specific parsing directly into Suite rendering logic.

## Avoid Premature Complexity

Do not introduce React, Next.js, a database, microservices, authentication, or a dedicated backend solely for architectural purity. Introduce them only when a concrete product requirement makes them necessary.

The initial TeamOS can be a domain layer inside the existing application/repository. The goal is to establish clean boundaries first, not to create infrastructure for its own sake.

## Current Objective

Establish the boundaries that allow Irish Watch to become the first Suite built on TeamOS without breaking the working product.

The eventual architecture is:

External Sources -> Adapters/Ingestion -> TeamOS -> Normalized Domain Model -> Suite -> Fan

## Product Language

Use these names consistently:
- Project LND
- TeamOS
- Suite
- Irish Watch

Do not rename these concepts casually. Project LND is the canonical project name.
