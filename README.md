# GitHub Copilot Template

A GitHub Copilot workspace template for Next.js App Router projects. Drop this into any repository to equip GitHub Copilot with project-aware agents, skills, prompts, safety hooks, and coding standards — out of the box.

---

## What's included

| Area                 | Description                                                                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Agents**           | Autonomous agents for dependency auditing, Linear ticket work, PR review, and project onboarding                                                          |
| **Skills**           | Reusable domain skills for accessibility audits, API docs generation, i18n auditing, performance review, security scanning, and unit test writing         |
| **Prompts**          | Reusable slash-command prompts for feature scaffolding, feature analysis, and commit message generation                                                   |
| **Instructions**     | Scoped coding-standard files for API routes, UI components, and Server Actions                                                                            |
| **Reference guides** | Best-practice references for React, Next.js, Server Actions, API routes, database/Prisma, accessibility, and security                                     |
| **Safety hooks**     | Pre-tool-use hooks that block destructive commands, secret leaks, `.env` file writes, oversized files, direct DB pushes, and unprotected branch mutations |
| **GitHub templates** | PR template and issue templates (bug report, feature request)                                                                                             |

---

## Getting started

### 1. Use this template

Click **Use this template** on GitHub (or clone the repo) into your project repository.

### 2. Run the Onboarding Agent

Open GitHub Copilot chat and invoke the onboarding agent:

```
@agent Onboarding Agent
```

The agent will interview you about your project and automatically fill in every `[PLACEHOLDER]` across the template — including `project-description.md`, `project-patterns.md`, `copilot-instructions.md`, and `.env.example` — then scaffold the initial `src/` directory tree.

### 3. Customise manually (optional)

If you prefer to fill placeholders yourself, edit these files directly:

- [`.github/copilot-instructions.md`](.github/copilot-instructions.md) — tech stack, project structure, and architectural standards
- [`.github/project-description.md`](.github/project-description.md) — product overview, glossary, feature areas, and business rules
- [`.github/instructions/references/project-patterns.md`](.github/instructions/references/project-patterns.md) — project-specific conventions that override the generic references

---

## Repository structure

```
.github/
├── agents/                         # Custom agent definitions (.agent.md)
│   ├── dependency-auditor.agent.md
│   ├── linear-ticket-worker.agent.md
│   ├── onboarding-agent.agent.md
│   └── pr-reviewer.agent.md
├── hooks/                          # PreToolUse safety hooks
│   ├── scripts/                    # Hook implementation scripts (Node.js)
│   ├── destructive-command-blocker.json
│   ├── env-file-guard.json
│   ├── file-size-guard.json
│   ├── git-branch-guard.json
│   ├── no-direct-db-push.json
│   └── secret-leak-guard.json
├── instructions/                   # Scoped coding instructions
│   ├── api-routes.instructions.md      # Applies to app/api/**
│   ├── components-ui.instructions.md   # Applies to components/ui/**
│   ├── lib-actions.instructions.md     # Applies to lib/actions/**
│   └── references/                     # Best-practice reference guides
│       ├── accessibility-best-practices.md
│       ├── api-route-best-practices.md
│       ├── db-best-practices.md
│       ├── nextjs-best-practices.md
│       ├── project-patterns.md
│       ├── react-best-practices.md
│       ├── security-best-practices.md
│       └── server-actions-best-practices.md
├── prompts/                        # Reusable prompt files (.prompt.md)
│   ├── feature-analysis.prompt.md
│   ├── scaffold-feature.prompt.md
│   └── write-commit-message.prompt.md
├── skills/                         # Domain skills (SKILL.md)
│   ├── accessibility-auditor/
│   ├── api-docs-generator/
│   ├── i18n-auditor/
│   ├── performance-auditor/
│   ├── security-auditor/
│   └── unit-test-writer/
├── ISSUE_TEMPLATE/
│   ├── bug-report.yml
│   ├── feature-request.yml
│   └── config.yml
├── copilot-instructions.md         # Root Copilot instructions
├── project-description.md          # Product context for all agents/skills
└── PULL_REQUEST_TEMPLATE.md
```

---

## Agents

Invoke agents from Copilot chat with `@agent <Name>` or via the agent picker.

| Agent                    | Trigger phrases                                                      | What it does                                                                        |
| ------------------------ | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| **Onboarding Agent**     | `starting a new project`, `first-time setup`, `fill in placeholders` | Interviews you, fills all placeholders, scaffolds `src/`                            |
| **PR Reviewer**          | `review a PR`, `review this branch`, `code review`                   | Reviews the diff against all best-practice references and posts a structured review |
| **Dependency Auditor**   | `audit dependencies`, `npm audit`, `check packages`                  | Runs `npm audit`, flags vulnerable/outdated packages, suggests upgrade paths        |
| **Linear Ticket Worker** | `work on a linear issue`, `implement this ticket`                    | Fetches ticket details, creates a branch, implements the work, opens a PR           |

---

## Skills

Skills are invoked automatically when your request matches their trigger phrases.

| Skill                     | Trigger phrases                                                     |
| ------------------------- | ------------------------------------------------------------------- |
| **accessibility-auditor** | `a11y audit`, `accessibility review`, `WCAG`, `keyboard navigation` |
| **api-docs-generator**    | `generate API docs`, `openapi spec`, `document this action`         |
| **i18n-auditor**          | `i18n audit`, `find hardcoded strings`, `missing translations`      |
| **performance-auditor**   | `performance review`, `slow feature`, `optimise [feature]`          |
| **security-auditor**      | `security audit`, `OWASP`, `vulnerability scan`                     |
| **unit-test-writer**      | `write tests`, `add tests`, `unit test`, `improve coverage`         |

---

## Prompts

| Prompt                   | Usage                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------- |
| **Scaffold Feature**     | `/scaffold-feature <featureName>` — generates the full file tree for a new dashboard feature |
| **Feature Analysis**     | `/feature-analysis` — analyses an existing feature for issues and improvement opportunities  |
| **Write Commit Message** | `/write-commit-message` — generates a conventional commit message from staged changes        |

---

## Safety hooks

These `PreToolUse` hooks run automatically before every Copilot tool call to protect the repository.

| Hook                          | What it blocks                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------------- |
| `secret-leak-guard`           | API keys, tokens, PEM blocks, and other secrets being written to files or the terminal |
| `env-file-guard`              | Writes to `.env`, `.env.local`, and other secret environment files                     |
| `destructive-command-blocker` | `rm -rf`, `git reset --hard`, `DROP TABLE`, and similar destructive commands           |
| `git-branch-guard`            | Force-pushes, hard resets, and amends on protected branches (`main`, `master`)         |
| `no-direct-db-push`           | `prisma db push` — enforces the use of `prisma migrate dev` instead                    |
| `file-size-guard`             | Prevents creating files above a configured size limit                                  |

---

## Tech stack (default)

The template is pre-configured for the following stack. Update `copilot-instructions.md` to match your actual choices.

- **Framework:** Next.js 16 (App Router, React 19)
- **Database:** PostgreSQL via Prisma ORM
- **UI:** shadcn/ui (Radix primitives), Tailwind CSS, Lucide icons, Sonner toasts
- **Communication:** Server Actions + `useServerAction` hook

---

## Architectural standards (summary)

Full details live in [`.github/copilot-instructions.md`](.github/copilot-instructions.md).

- **Server Actions** live in `src/lib/actions/<domain>.ts` and always return `{ success: true; data } | { success: false; error }` — never throw to the client.
- **Input validation** uses Zod on every action before touching the database.
- **Data fetching** prefers async Server Components over `useEffect`.
- **Auth** is enforced in `src/proxy.ts` and at the top of every mutating action — never only in the UI.
- **Soft deletes** via `deletedAt DateTime?` — hard deletes are not permitted.
- **Errors** are surfaced to users via Sonner toasts, never `alert()`.
- **Styling** uses Tailwind utility classes only — no inline `style={{}}` except for dynamic values.

---

## Contributing

1. Fork the repository.
2. Create a branch: `git checkout -b feat/your-improvement`.
3. Make your changes and open a pull request using the PR template.

Please keep agents, skills, and hooks generic so they remain useful across projects.

---

## License

MIT
