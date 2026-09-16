# Project LND Architecture

## Target Architecture

```text
External Sources
      |
      v
Adapters / Ingestion
      |
      v
TeamOS
      |
      v
Normalized Domain Model
      |
      v
Suite
      |
      v
Fan
```

## Project Layers

### Project LND

The product vision and platform boundary. It defines the experience and architectural principles but is not a runtime layer by itself.

### TeamOS

The sports-domain and team-intelligence layer. TeamOS knows what a team is, what games and players are, how external data maps into those concepts, and what capabilities a team supports.

### Suite

The fan-facing product layer. Suite renders the team destination, handles interaction, and adapts the experience to context such as game day or offseason.

### Irish Watch

The first Suite implementation, initially focused on Notre Dame football.

## Team Configuration

Team configuration is the key separation between generic application behavior and team-specific identity.

A team should provide data such as:

- Stable team ID
- Name and short name
- Sport and league
- External provider IDs
- Identity and colors
- Logos
- Venue
- Capabilities
- Supported content sources
- Sport-specific options

A generic Suite should consume this information rather than contain `if Notre Dame` rendering branches.

## Provider Adapter Boundary

External providers are implementation details. For example:

```text
ESPN API -> ESPN adapter -> normalized Game
```

Suite should consume the normalized `Game`, not ESPN's response object.

This keeps provider changes from becoming UI changes.

## TeamOS Responsibilities

TeamOS should own:

- Team configuration
- External IDs
- Provider adapters
- Normalization
- Schedule and game data
- Roster/player data
- Rankings
- News/media normalization
- History
- Capabilities
- Freshness/source status
- Derived team context

## Suite Responsibilities

Suite should own:

- Navigation
- Layout
- Cards and panels
- Team identity presentation
- Responsive behavior
- Interaction
- Contextual views
- User-facing loading/error/empty states
- Fan personalization

Suite should not own provider parsing or raw provider schemas.

## Sport Differences

Not every sport has the same concepts. Avoid pretending otherwise.

Use:

- Capabilities
- Sport-specific configuration
- Adapters
- Optional domain fields

Examples:

- College football may have recruiting and depth charts.
- NFL may have free agency and draft context.
- MLB may have pitching/lineup concepts.
- NBA may have rotation and advanced player metrics.

These differences should extend the domain model without forcing separate applications.

## Infrastructure Principle

TeamOS does not initially require a dedicated backend, database, or microservice architecture. The first objective is a clean logical boundary inside the existing repository.

Infrastructure should follow product requirements such as accounts, community, persistent notifications, AI workloads, or other capabilities that genuinely require it.

## Architectural Test

The architecture is working when the same Suite can consume two different team configurations with minimal or no changes to Suite code.

```text
TeamOS(Notre Dame) -> Suite -> Irish Watch
TeamOS(Ohio State) -> Suite -> Ohio State Suite
```
