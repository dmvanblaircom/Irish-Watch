# Project LND Documentation

This directory contains the durable product and technical knowledge for Project LND.

The root `README.md` is the front door to the repository. These documents go deeper and should be updated when durable product or architecture decisions change.

## Structure

| Directory | Purpose |
|---|---|
| `strategy/` | Product thesis and strategic direction |
| `product/` | Fan experience, product principles, MVP scope, roadmap |
| `architecture/` | TeamOS, Suite, Irish Watch, system boundaries |
| `research/` | Market evidence, competitive landscape, validation work |
| `decisions/` | Durable decisions and their rationale |

## Documentation status labels

Use these labels inside documents where useful:

- **FACT** — supported by research, code, or product data.
- **ASSUMPTION** — believed to be true but not yet validated.
- **HYPOTHESIS** — an assumption being explicitly tested.
- **DECISION** — a chosen direction the product is being built around.
- **OPEN QUESTION** — unresolved and intentionally left open.

## Working rule

The repository should be the source of truth for durable product and technical decisions that affect the software. Chat can be used to explore ideas, but decisions worth building around should eventually be captured here.

When a change materially affects product behavior, architecture, system responsibilities, user flows, or a durable assumption, update the relevant documentation in the same workstream.
