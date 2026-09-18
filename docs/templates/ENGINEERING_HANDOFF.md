# Engineering Handoff: [Feature]

## Product Brief

Link to the approved product brief.

## Objective

What should Claude Code implement?

## Existing Behavior to Preserve

- 
- 

## Relevant Areas

Identify likely files, modules, workflows, or data sources. These are starting points, not mandatory implementation targets.

- 
- 

## Architecture Constraints

- Follow `CLAUDE.md`
- Preserve Project LND boundaries
- Keep provider-specific parsing behind adapters/normalization
- Keep team identity and team-specific behavior in configuration/data where possible
- Do not introduce unrelated infrastructure

Additional constraints:
- 

## Acceptance Criteria

- [ ] 
- [ ] 
- [ ] 

## Validation

Run the relevant existing checks and any feature-specific validation.

## Out of Scope

- 
- 

## Stop / Escalate If

Claude Code should stop and ask for direction if:
- A product decision is required
- The requested behavior conflicts with an established architecture decision
- The safest implementation requires materially expanding scope
- Existing behavior cannot be preserved without a product decision

## Expected Engineering Report

When complete, report:
- Summary of changes
- Files changed
- Tests/checks run and results
- Behavior intentionally changed
- Risks or follow-up work
- Any decisions that should be recorded