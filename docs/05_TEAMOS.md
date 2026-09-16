# TeamOS

## Role

TeamOS is the domain intelligence layer of Project LND. It is the brains between external sports sources and Suite.

```text
External sources -> TeamOS -> Suite
```

## Responsibilities

TeamOS owns:

- Team configuration
- External provider IDs
- Provider adapters
- Data normalization
- Schedule and game data
- Roster/player data
- Rankings
- News and media normalization
- Historical data
- Team capabilities
- Source freshness/status
- Derived team context

## What TeamOS Does Not Own

TeamOS should not own:

- Page layout
- CSS
- Navigation presentation
- Cards and visual components
- Fan interaction design
- Raw provider schemas exposed to the UI

## Example

```text
ESPN response
    |
    v
ESPN adapter
    |
    v
Normalized Game
    |
    v
TeamOS
    |
    v
Suite game card / game page
```

The Suite should not care whether a game came from ESPN, another provider, or a local snapshot.

## Current Implementation

Initially, TeamOS can be a logical/domain layer inside the existing repository. The current GitHub Actions workflows and local snapshots can remain in place while boundaries are established.

The goal is not to create a backend immediately. The goal is to make ownership clear.

## Future Intelligence Layer

TeamOS can eventually provide structured context for AI experiences. For example, an AI preview should be able to consume:

- Upcoming game
- Recent results
- Injuries/availability
- Rankings
- Team trends
- Historical context
- Relevant news
- User's followed teams

That context should come from TeamOS rather than requiring the AI layer to understand every external provider independently.
