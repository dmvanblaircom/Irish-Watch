# Team Configuration

## Principle

**Notre Dame is data, not code.**

Team configuration separates team identity and team-specific capabilities from generic Suite behavior.

## Illustrative Shape

```js
{
  id: "notre-dame",
  name: "Notre Dame",
  shortName: "ND",
  sport: "football",
  league: "college-football",
  externalIds: {
    espn: "87"
  },
  identity: {
    primary: "#0C2340",
    secondary: "#C99700"
  },
  venue: {
    name: "Notre Dame Stadium"
  },
  capabilities: {
    rankings: true,
    depthChart: true,
    recruiting: true,
    championshipOdds: true
  }
}
```

This is illustrative, not a final schema.

## What Belongs in Configuration

- Stable team identity
- External IDs
- Branding
- Venue defaults
- Capabilities
- Supported content sources
- Team-specific metadata
- Structured exceptions that are genuinely part of the team's domain

## What Does Not Belong in Configuration

Do not turn configuration into a dumping ground for arbitrary code or UI behavior.

Avoid fields such as:

- HTML templates
- Rendering functions
- Provider response objects
- Large conditional rule sets
- One-off hacks that should actually be fixed in TeamOS

## Ohio State Test

A second team should be addable by supplying a second configuration object and any required provider/source mappings.

The Suite should not need to be duplicated.

## Exceptions

Real exceptions will exist. The preferred order is:

1. Generic domain behavior
2. Team configuration
3. TeamOS adapter/normalization rule
4. Explicit capability
5. Only then, a narrowly scoped exception

Avoid spreading one-off exceptions through rendering code.

## Keep the Initial Schema Small

Do not design a perfect universal sports schema before a second use case exists. Start with what Irish Watch needs, then validate the model against Ohio State and the next sport.
