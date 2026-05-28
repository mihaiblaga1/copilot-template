# `.github/` — Copilot Template System

This directory contains the complete GitHub Copilot customization layer for this project. Everything here works together to give Copilot project-aware context, enforce coding standards, and automate common workflows.

---

## How the pieces fit together

```
                    ┌──────────────────────────┐
                    │  copilot-instructions.md  │  ← global rules, always loaded
                    └────────────┬─────────────┘
                                 │
              ┌──────────────────┼──────────────────┐
              ▼                  ▼                   ▼
     ┌────────────┐    ┌─────────────────┐   ┌────────────┐
     │   Agents   │    │     Skills      │   │   Prompts  │
     │ (autonomous│    │ (domain experts │   │ (one-shot  │
     │  workflows)│    │  loaded on      │   │  templates)│
     └─────┬──────┘    │  demand)        │   └────────────┘
           │           └────────┬────────┘
           │                    │
           ▼                    ▼
     ┌──────────────────────────────────┐
     │  instructions/references/        │  ← best-practice rules
     │  project-patterns.md             │  ← YOUR project overrides
     │  project-description.md          │  ← product context & glossary
     └──────────────────────────────────┘
           │
           ▼
     ┌──────────────┐
     │    Hooks     │  ← safety guards that run before every tool call
     └──────────────┘
```

---

## Agents (`agents/`)

Agents are autonomous, multi-step workflows invoked via `@agent <Name>` in Copilot chat.

| Agent                    | What it does                                                                                        | When to use                   |
| ------------------------ | --------------------------------------------------------------------------------------------------- | ----------------------------- |
| **Onboarding Agent**     | Interviews you, fills all `[PLACEHOLDER]` values, scaffolds `src/`                                  | First-time project setup      |
| **Linear Ticket Worker** | Fetches a Linear ticket, creates a branch, implements the work, runs audits, opens a PR             | When assigned a Linear ticket |
| **PR Reviewer**          | Reviews a PR diff against all best-practice references, posts structured findings                   | Before merging any PR         |
| **Dependency Auditor**   | Runs `npm audit`, flags vulnerable/outdated packages, creates Linear tickets for Critical/High CVEs | Periodic supply-chain checks  |

---

## Skills (`skills/`)

Skills are reusable domain experts that Copilot loads automatically when your request matches their trigger phrases. They can also be loaded by agents and prompts.

| Skill                     | Trigger phrases                                        | Creates Linear tickets?        |
| ------------------------- | ------------------------------------------------------ | ------------------------------ |
| **accessibility-auditor** | `a11y audit`, `WCAG`, `keyboard navigation`            | Yes                            |
| **api-docs-generator**    | `generate API docs`, `openapi spec`, `tsdoc`           | No                             |
| **i18n-auditor**          | `i18n audit`, `find hardcoded strings`, `localization` | Yes                            |
| **linear-ticket-writer**  | _(shared utility — loaded by other skills)_            | Yes (it IS the ticket creator) |
| **performance-auditor**   | `performance audit`, `slow feature`, `optimise`        | Yes                            |
| **security-auditor**      | `security audit`, `OWASP`, `vulnerability scan`        | Yes                            |
| **unit-test-writer**      | `write tests`, `unit test`, `improve coverage`         | No                             |

### How skills share the Linear ticket format

All skills that create Linear tickets load `linear-ticket-writer/SKILL.md` as a shared dependency. This ensures consistent title format, description structure, priority mapping, and label strategy across every auditor. Each caller adds its own overrides (source label, field mappings).

---

## Prompts (`prompts/`)

Prompts are one-shot, template-driven workflows invoked via the Copilot prompt picker.

| Prompt                   | What it does                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------ |
| **Scaffold Feature**     | Generates the full file tree for a new dashboard feature (page, actions, types, components)            |
| **Feature Analysis**     | Analyses an existing feature for technical and product gaps, creates Linear tickets                    |
| **Create Linear Ticket** | Interviews you for title, description, priority, and labels, then creates a single Linear ticket       |
| **Write Commit Message** | Generates a Conventional Commits message from the staged diff; auto-detects ticket ID from branch name |

---

## Instructions (`instructions/`)

### Scoped instructions (auto-applied)

These files use `applyTo` frontmatter to automatically load rules when you edit matching files:

| File                            | Auto-applied to       |
| ------------------------------- | --------------------- |
| `api-routes.instructions.md`    | `**/app/api/**`       |
| `components-ui.instructions.md` | `**/components/ui/**` |
| `lib-actions.instructions.md`   | `**/lib/actions/**`   |

### Reference guides (`instructions/references/`)

Technology-level best practices loaded by agents and skills before generating or reviewing code. **Do not edit these** — they encode generic rules.

Override them per-project by filling in `project-patterns.md`.

---

## Hooks (`hooks/`)

Safety guards that run automatically before every Copilot tool call. They block dangerous operations before they happen.

| Hook                          | What it blocks                                            |
| ----------------------------- | --------------------------------------------------------- |
| `secret-leak-guard`           | API keys, tokens, PEM blocks written to files or terminal |
| `env-file-guard`              | Writes to `.env`, `.env.local`, and other secret files    |
| `destructive-command-blocker` | `rm -rf`, `git reset --hard`, `DROP TABLE`, etc.          |
| `git-branch-guard`            | Force-pushes and hard resets on `main`/`master`           |
| `no-direct-db-push`           | `prisma db push` (enforces `prisma migrate dev`)          |
| `file-size-guard`             | Creating files above the configured size limit            |

---

## Key files at root level

| File                       | Purpose                                                                               |
| -------------------------- | ------------------------------------------------------------------------------------- |
| `copilot-instructions.md`  | Global architectural standards, tech stack, project structure — loaded by every agent |
| `project-description.md`   | Product context, glossary, feature areas, business rules — loaded by every agent      |
| `PULL_REQUEST_TEMPLATE.md` | PR template with checklists enforced by the PR Reviewer agent                         |
| `dependabot.yml`           | Automated weekly npm dependency updates                                               |

---

## First-time setup

Run `@agent Onboarding Agent` in Copilot chat. It will guide you through filling every placeholder. Or fill these files manually:

1. `project-description.md` — product name, glossary, features, business rules
2. `instructions/references/project-patterns.md` — auth, naming, org scoping, integrations, error handling, toasts, DTOs
3. `copilot-instructions.md` — tech stack placeholders (`[AUTH_PROVIDER]`, `[EMAIL_PROVIDER]`, etc.)
