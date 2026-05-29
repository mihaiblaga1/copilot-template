---
name: linear-ticket-writer
description: "Shared skill for creating well-structured Linear tickets from audit findings. Provides the priority mapping, label strategy, batching rules, and post-creation summary. Load this skill whenever a skill, prompt, or agent needs to create Linear tickets — then apply any caller-specific overrides on top. Use linear-ticket-template.md for the canonical title and description format."
---

# Linear Ticket Writer

This is a **shared utility skill**, primarily loaded by other skills and prompts to ensure every Linear ticket follows a consistent format. It can also be invoked directly to create a single well-structured Linear ticket.

> **Ticket format:** Read [`linear-ticket-template.md`](./linear-ticket-template.md) for the canonical title and description structure before creating any tickets.

---

## Pre-Creation Steps

Before creating any tickets, always perform these steps in order:

1. **Load the template** — read `linear-ticket-template.md` and use it for every ticket's title and description.
2. **Read integration settings** — read `instructions/references/integrations.md` and extract `LINEAR_TEAM_ID` and `LINEAR_TEAM_NAME`.
   - If either value is still a placeholder (e.g. `[LINEAR_TEAM_ID]`):
     1. Call `mcp_linear_list_teams` and print the full team list to the user.
     2. Ask: _"Which team should these tickets be created under?"_
     3. Wait for explicit confirmation — do **not** guess.
     4. Update `integrations.md` with the confirmed Team Name and Team ID before continuing.
   - If both values are filled, use them directly — do **not** call `mcp_linear_list_teams` again.
3. **Discover labels** — call `mcp_linear_list_issue_labels` with the confirmed team ID and use existing IDs. Never invent label IDs.
4. **Create feature label (if needed)** — if a caller-specific label (e.g. `{featureLabel}-performance`) does not exist, create it via `mcp_linear_create_issue_label` with an appropriate color:
   - `#DC2626` — Critical / Urgent
   - `#F97316` — High
   - `#EAB308` — Medium
   - `#6B7280` — Low / Info

---

## Priority Mapping

| Severity            | Linear Priority Value | Linear Priority Name |
| ------------------- | --------------------- | -------------------- |
| Critical            | 1                     | Urgent               |
| High                | 1                     | Urgent               |
| Medium              | 2                     | High                 |
| Low                 | 3                     | Medium               |
| Info / Nice-to-Have | 4                     | Low                  |

---

## Label Strategy

Apply labels from this table. Use the closest existing label — do **not** fail if an exact match is missing.

| Finding Type                | Recommended Labels                     |
| --------------------------- | -------------------------------------- |
| Critical / High security    | `bug`, `security`, `{source-label}`    |
| Critical / High performance | `bug`, `performance`, `{source-label}` |
| Medium technical issue      | `tech-debt`, `{source-label}`          |
| Must-Have product gap       | `must-have`, `{source-label}`          |
| Should-Have improvement     | `enhancement`, `{source-label}`        |
| Nice-to-Have                | `nice-to-have`, `{source-label}`       |

`{source-label}` is the caller-specific label (e.g. `top-users-performance`, `feature-analysis`).

---

## Batching Rules

- Create tickets **one at a time** (Linear API is not bulk).
- After each creation, print the ticket ID and URL so the user can track progress.
- If any ticket fails to create, log the title and error — do **not** abort the remaining tickets.

---

## Post-Creation Summary

After all tickets are created, output this block (callers may append extra lines):

```
## Linear Issues Created

### Critical / High (Urgent)
- [XX-123] [Feature] Title — https://linear.app/...

### Medium (High)
- ...

### Low / Nice-to-Have
- ...

Total: X issues created.
```
