# Data Architecture

## Current State

Irish Watch currently combines live provider data, local snapshots, and GitHub Actions workflows. This is acceptable for the proof of concept but should become more explicit as Project LND evolves.

## Target Flow

```text
External Sources
      |
      v
Adapters / Ingestion
      |
      v
TeamOS normalized data
      |
      v
Suite
```

## Provider Isolation

Provider-specific schemas should stop at the adapter boundary.

For example:

```text
ESPN API -> ESPN adapter -> normalized Game
```

The Suite should consume the normalized Game.

This makes it possible to change providers or add providers without rewriting presentation logic.

## Local Snapshots

Local JSON snapshots are currently useful for resilience, caching, and offline behavior. They do not need to be eliminated immediately.

They should eventually represent normalized data rather than leaking provider-specific response shapes into the UI.

## GitHub Actions

The current GitHub Actions workflows perform significant Notre Dame-specific ingestion and processing. They can remain initially.

Over time, move toward configurable pipelines where the team and provider are inputs rather than assumptions embedded in workflow logic.

## Content Model

News and media should be normalized into stable concepts such as `NewsItem` and `MediaItem` with source metadata attached.

## Odds

Odds are optional and capability-driven. Not every sport, league, or team will expose the same betting/market information.

## Weather

Weather should be associated with a game/venue context rather than treated as a generic team property.

## Freshness

TeamOS should eventually expose source freshness/status so Suite can distinguish between:

- Live/current data
- Recently cached data
- Stale data
- Unavailable data

This is especially important for a sports product where timing matters.

## Backend Timing

A dedicated backend becomes justified when product requirements need things such as:

- User accounts
- Persistent preferences
- Community
- Notifications
- Server-side AI workloads
- Shared user-generated content
- Durable analytics or personalization

Until then, avoid infrastructure for infrastructure's sake.
