# Project LND North Star

## Vision

Project LND (Leave No Doubt) is a sports platform built around the team, not around a generic sports database.

Existing sports apps generally work like this:

> Sports app -> choose favorite teams -> filter the experience

Project LND should work like this:

> Choose your team -> the entire experience becomes that team's destination

The team becomes the center of the product: identity, schedule, scores, news, media, stats, rankings, history, community, notifications, and eventually AI-powered context.

## Product Thesis

**Don't build another sports app. Build the platform that turns any sports team into a personalized digital destination.**

A Notre Dame fan should feel like they have a dedicated Notre Dame product. An Ohio State fan should receive an Ohio State experience. The same underlying platform should support both.

## Product Architecture

- **Project LND** = overall product vision
- **TeamOS** = domain intelligence/platform layer
- **Suite** = fan-facing experience
- **Irish Watch** = first team-specific implementation and proof of concept

A useful mental model:

> TeamOS is the brains. Suite is the experience.

## Year-Round Destination

Suite should not disappear when the game ends. It should support:

- Game day
- Post-game
- Offseason
- Recruiting
- Free agency
- Draft season
- Trade deadline
- Breaking news
- Media
- Stats
- History
- Community
- Everyday team following

The experience can change by context without changing the underlying destination.

## Potential Suite Capabilities

### Team
- Home / Now
- Schedule
- Roster
- Depth chart
- Stats
- Rankings
- Injuries / availability
- Recruiting where applicable
- History
- Rivalries

### Game Day
- Live score
- Game status
- Drive or play-by-play
- Game stats
- Key moments
- Game thread
- Broadcast information
- Weather and venue context

### News & Media
- Team news
- Beat writers
- Podcasts
- YouTube
- Social sources
- Curated external media

### Fan Layer

Users should eventually be able to maintain multiple teams and receive a personalized experience around them.

Example My Teams:
- Notre Dame
- Ohio State
- Cleveland Cavaliers
- Cleveland Guardians

This creates a future "My Day" or "My Saturday" experience organized around the user's teams instead of around generic sports categories.

## AI Direction

AI should be a layer over structured sports data, team content, and user preferences. It should not simply be a generic chatbot bolted onto the product.

Potential experiences:
- Catch Me Up
- What should I know before the game?
- Give me the five things that matter before kickoff.
- Recap my game
- Why did we lose?
- Personalized previews
- Historical context
- Team assistant

TeamOS should provide the structured context that makes these experiences useful.

## Initial Wedge

Start with college football. This is the natural wedge because Irish Watch already exists, the sport has strong team identity, and the product concept is easy to demonstrate.

Do not attempt every sport at once.

A sensible expansion path is:

1. College Football
2. College Basketball
3. NFL / NBA / MLB / NHL
4. Soccer and other leagues

## North Star Test

The architecture is successful when the same application can produce:

- Notre Dame configuration -> Irish Watch
- Ohio State configuration -> Ohio State Suite
- Bengals configuration -> Bengals Suite
- Cavaliers configuration -> Cavaliers Suite

without copying the application or scattering team-specific conditionals throughout the code.

## Core Principle

**The team should feel like the product, not a filter inside the product.**
