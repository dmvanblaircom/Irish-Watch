# Project LND

**Leave No Doubt**

Project LND is a sports fan experience platform built around a simple idea: make following a team feel less fragmented, more personal, and easier to return to every day.

The project has three layers:

- **TeamOS** — the platform and operating layer that powers team-specific experiences.
- **Suite** — the fan-facing experience layer.
- **Irish Watch** — the first team-specific implementation and product laboratory.

## Product thesis

A passionate sports fan should not have to piece together their relationship with a team across a dozen disconnected places.

**Suite helps fans stay connected to their team without having to piece their fandom together across a dozen different places.**

Phase 1 is intentionally focused on earning the fan rather than monetizing the fan.

> **We don't monetize the fan first. We earn the fan first.**

## What this repository is

This repository is the working product repository for Project LND. It contains the current Irish Watch implementation plus the durable product, architecture, research, and decision documentation needed to evolve it into a reusable platform.

It is not intended to contain the entire LND business plan, financial model, legal work, or every research artifact. Those remain in the LND business workspace and are summarized here when they directly affect product decisions.

## Current status

**Stage:** Early product validation / platform formation

Irish Watch is the first laboratory. The goal is not to rebuild it from scratch. The existing PWA architecture, caching/offline behavior, accessibility, and responsive foundation should be preserved while the product experience and underlying concepts are generalized for future teams.

## Repository map

```text
Project-LND/
├── README.md
├── docs/
│   ├── strategy/       # Product thesis and strategic direction
│   ├── product/        # Fan experience, MVP scope, roadmap, principles
│   ├── architecture/   # TeamOS, Suite, Irish Watch, system decisions
│   ├── research/       # Market evidence, competition, validation
│   └── decisions/      # Durable decisions and their rationale
├── index.html
├── app.js
├── app.css
└── assets / supporting files
```

## Core architecture

```text
PROJECT LND
    │
    ├── TeamOS
    │   Platform / brains
    │
    └── Suite
        Fan experience
            │
            ├── Irish Watch
            └── Future team experiences
```

TeamOS asks: **What does the platform need to make this possible?**

Suite asks: **What does the fan need?**

## Documentation principles

Documentation should distinguish between:

- **FACT** — supported by research, code, or product data.
- **ASSUMPTION** — believed to be true but not yet validated.
- **HYPOTHESIS** — an assumption being explicitly tested.
- **DECISION** — a chosen direction that the product is being built around.
- **OPEN QUESTION** — unresolved and intentionally left open.

Product and architecture changes should update the relevant documentation when they change a durable assumption, user flow, system responsibility, or product decision.

## First validation hypothesis

> **H1:** Passionate college sports fans will repeatedly use a free, team-specific digital experience if it makes following their team more convenient, relevant, and engaging than the fragmented alternatives they currently use.

The first validation dimensions are acquisition, activation, retention, engagement, advocacy, and expansion to additional teams.

## Product principles

1. **Fan first.** Build around the fan's relationship with the team.
2. **Fast.** The experience should feel immediate, especially on game day.
3. **Clean.** Reduce noise and unnecessary complexity.
4. **Accurate.** Scores, schedules, stats, and other core information are product requirements.
5. **Useful.** Every major surface should help the fan follow, understand, or participate.
6. **Personal.** The experience should become more relevant as the fan uses it.
7. **Platform-minded.** Irish Watch should prove concepts that can eventually work for many teams.
8. **Earn before monetizing.** Phase 1 consumer access is intentionally free by design.

## Next product work

The immediate documentation and product work is the **Fan Experience Blueprint**. It maps the fan journey before, during, and after games, between games, through news and recruiting cycles, and into the offseason. Each journey stage should identify current behavior, friction, Suite opportunity, TeamOS requirements, MVP scope, and validation requirements.

## Getting started

The current implementation is a lightweight web/PWA application. Open `index.html` or use the existing deployment workflow to run the current experience.

See the `docs/` directory for product and architecture documentation before making changes that affect the broader LND platform.
