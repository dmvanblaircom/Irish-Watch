# LND Fan Experience Blueprint v0.1

**Status:** HYPOTHESIS / working blueprint  
**Last updated:** 2026-09-16

## Purpose

This document maps the fan's relationship with a team across the full sports cycle. It is the bridge between the LND product thesis and the actual Suite / Irish Watch roadmap.

The goal is to identify where fans currently experience fragmentation, what Suite could do better, what TeamOS must provide, and what should deliberately remain outside the first product scope.

## The fan journey

### 1. Before the game

**Fan need:** Know when the game is, what matters, and what to expect.

**Current behavior / likely fragmentation:** Calendar, team site, sports app, social feeds, news, and group chats may all provide pieces of the pregame experience.

**Suite opportunity:** A single team-specific pregame destination with time, opponent, context, relevant news, key players, and personalized reminders.

**TeamOS requirement:** Reliable schedule/event model, team identity, content aggregation, notification capability, personalization.

**MVP:** Yes.

**Validation:** Do fans open Suite on game day before the game? Do they return after receiving a useful notification or update?

### 2. Game day / during the game

**Fan need:** Follow the game when watching, listening, or away from the screen.

**Current behavior / likely fragmentation:** Score app, broadcast, social feeds, live stats, game thread, team site, and text messages.

**Suite opportunity:** A fast Game Center that combines score, game state, key events, stats, and selected context without overwhelming the user.

**TeamOS requirement:** Live game data, event processing, caching, reliable state transitions, notification delivery.

**MVP:** Yes. This is a core differentiator and a critical quality test.

**Validation:** Load speed, return frequency, session depth, live-update reliability, and user retention on game days.

### 3. Immediately after the game

**Fan need:** Understand what happened and what matters next.

**Current behavior / likely fragmentation:** Scoreboard, box score, social posts, news articles, highlights, and postgame interviews.

**Suite opportunity:** A concise postgame experience: result, key moments, stats, recap, highlights, and next event.

**TeamOS requirement:** Game results, stats, content ingestion, event relationships, recap generation where appropriate.

**MVP:** Yes.

**Validation:** Do users return after the final whistle? Which postgame surfaces drive repeat use?

### 4. Sunday / Monday

**Fan need:** Process the game, discuss it, and understand the implications.

**Current behavior / likely fragmentation:** Podcasts, social conversation, news, message threads, rankings, standings, and analysis.

**Suite opportunity:** A structured team-specific follow-up experience that surfaces meaningful news, reactions, results, standings, and the next storyline.

**TeamOS requirement:** Content aggregation, personalization, team context, notification rules.

**MVP:** Partial. Start with news, results, next game, and relevant context. Avoid trying to build a complete media ecosystem.

**Validation:** Measure return visits in the 24–48 hours following games.

### 5. Between games

**Fan need:** Stay connected even when nothing is happening live.

**Current behavior / likely fragmentation:** Social feeds, news sites, team sites, recruiting coverage, podcasts, video platforms, and general sports apps.

**Suite opportunity:** A persistent team home that makes the team worth checking even on ordinary days.

**TeamOS requirement:** Content model, personalization, notifications, player/team profiles, editorial or automated prioritization.

**MVP:** Yes, but lightweight.

**Validation:** Weekly active use, return frequency, content interaction, notification engagement.

### 6. News and recruiting cycle

**Fan need:** Know what changed and why it matters to the team.

**Current behavior / likely fragmentation:** Team reporters, recruiting services, social accounts, message boards, national media, and official announcements.

**Suite opportunity:** Consolidate relevant team-specific developments and provide context without requiring the fan to monitor every source.

**TeamOS requirement:** Content ingestion, source normalization, player/team entities, relevance ranking, source attribution.

**MVP:** Limited. Start with aggregation and clear source attribution rather than building original journalism.

**Validation:** Which stories bring users back? Do fans perceive the feed as useful enough to replace some manual checking?

### 7. Offseason

**Fan need:** Maintain connection when games disappear from the calendar.

**Current behavior / likely fragmentation:** Recruiting, roster moves, schedules, offseason content, historical information, and social feeds.

**Suite opportunity:** Turn the team relationship into a year-round experience rather than a game-day utility.

**TeamOS requirement:** Durable team/player profiles, calendar, content relationships, notifications, personalization.

**MVP:** Later phase.

**Validation:** Can engagement remain meaningfully above zero after the season ends? Which offseason behaviors predict next-season retention?

## Cross-journey product requirements

### Speed

The experience must feel immediate. Slow loading is especially damaging during live sports moments.

### Accuracy

Scores, schedules, game state, and other core information must be treated as product requirements. A beautiful interface with incorrect information is not a successful fan experience.

### Context

Information should be connected to the team rather than presented as isolated data points.

### Personalization

The product should progressively learn what matters to each fan without forcing users through complicated setup.

### Continuity

The experience should remember the fan's relationship with the team across days, games, and seasons.

### Participation

Interaction should add value without requiring LND to become a full social network.

## What Suite owns vs. what TeamOS enables

| Suite | TeamOS |
|---|---|
| Fan-facing navigation | Team and event data model |
| Home experience | Content ingestion and normalization |
| Game Center | Live data processing |
| News / updates presentation | Personalization capabilities |
| Fan preferences | Notification infrastructure |
| Team / player presentation | Identity and team configuration |
| Participation surfaces | Shared platform services |

The boundary is intentionally conceptual at this stage. Implementation responsibilities should become more precise as the platform architecture matures.

## What Irish Watch should teach us

Irish Watch is the first laboratory. Every major feature should be evaluated for two questions:

1. Does this make the Notre Dame fan experience materially better?
2. Is the underlying capability reusable for another team?

A feature that answers only the first question may still be valuable, but should not automatically become TeamOS architecture.

## Deliberately out of scope for v0.1

- full social graph
- direct messaging
- fantasy integration
- betting
- ticketing marketplace
- merchandise marketplace
- large-scale creator platform
- sophisticated advertising system
- consumer subscription billing
- broad multi-sport expansion before the core college-team experience is validated

## Key open questions

1. Which fan journey moments drive the most repeat behavior?
2. Which information sources are essential enough to integrate directly?
3. How much personalization is valuable before it becomes distracting?
4. Which Suite capabilities should be universal TeamOS services versus team-specific configuration?
5. What is the minimum experience that makes a fan say, "I don't need to check five other places first"?
6. What behavior demonstrates that the platform has earned a persistent place in a fan's routine?
