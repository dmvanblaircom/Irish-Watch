# 0001 — Platform Architecture

**Status:** Accepted  
**Date:** 2026-09-16

## Context

Project LND needs to evolve from a Notre Dame-specific fan application into a reusable platform without rebuilding the existing Irish Watch experience from scratch.

The product therefore needs a clear separation between the platform capabilities that can support multiple teams and the fan-facing experience that expresses those capabilities for a specific team.

## Decision

Project LND will use three conceptual layers:

```text
Project LND
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

- **TeamOS** is the reusable platform and operating layer.
- **Suite** is the fan-facing experience layer.
- **Irish Watch** is the first team-specific implementation and validation laboratory.

## Why

This structure allows the project to improve the existing fan experience while building toward capabilities that can eventually support multiple organizations.

It also creates a useful product distinction:

- TeamOS asks: **What does the platform need to make this possible?**
- Suite asks: **What does the fan need?**

## Consequences

### Positive

- Irish Watch can remain the fastest place to test product ideas.
- Reusable capabilities can be identified before being generalized.
- Future teams do not need to be treated as separate product architectures.
- Fan experience decisions remain distinct from platform implementation decisions.

### Tradeoffs

- Some capabilities will initially exist only in Irish Watch.
- Generalizing too early could slow product learning.
- Generalizing too late could create technical debt.
- The TeamOS/Suite boundary will need to become more precise as the product matures.

## Rejected approach

A full rewrite of Irish Watch into a generalized multi-team platform is intentionally rejected at this stage. The existing application is the laboratory, not disposable prototype code.

## Review trigger

Revisit this decision when a second team experience is being actively built or when the current Irish Watch implementation creates a clear reusable-platform constraint.
