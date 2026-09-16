# Project LND Domain Model

The domain model should describe sports concepts, not provider schemas.

## Core Entities

### Sport

Represents a sport such as football, basketball, baseball, hockey, or soccer.

### League

Represents a competition or league such as NCAA/FBS, NFL, NBA, MLB, NHL, MLS, or EPL.

### Team

Represents the core team identity and stable identifiers.

Suggested fields:

- id
- name
- shortName
- sport
- league
- conference/division where applicable
- externalIds
- identity
- venue
- capabilities

### Team Identity

Represents presentation and branding data:

- Primary color
- Secondary color
- Accent color
- Logos
- Typography choices where supported
- Imagery
- Display terminology

### Venue

Represents a home or game venue and relevant location information.

### Game

A normalized representation of a scheduled or completed event.

Potential fields:

- id
- season
- status
- startTime
- homeTeam
- awayTeam
- venue
- score
- broadcast
- odds where available
- weather where available
- series/history context

### Player

Normalized player information independent of provider schema.

### Roster / Depth

Represents roster membership, positions, depth, availability, and sport-specific lineup concepts.

### Ranking

Represents a ranking source, rank, and time/season context.

### News Item

A normalized article/content item:

- id
- title
- summary
- source
- url
- publishedAt
- image
- team association
- sport/league association

### Media Item

Represents podcasts, videos, social content, or other media sources.

### History

Represents historical seasons, records, results, rivalries, championships, and related context.

### User

Represents a fan once personalization/account functionality is introduced.

### My Teams

Represents the teams a user follows and the user's preferences around them.

### Event

A generic domain event that can support schedules, notifications, community activity, or future workflows.

## Domain Principles

1. Domain objects should be provider-neutral.
2. Provider-specific IDs can exist as external identifiers but should not become domain identity.
3. Optional fields are preferable to fake universal concepts.
4. Sport-specific concepts should be modeled intentionally.
5. Suite should consume domain objects rather than raw APIs.
