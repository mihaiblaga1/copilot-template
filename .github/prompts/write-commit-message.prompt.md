---
name: "Write Commit Message"
description: "Given the output of git diff --staged, produces a well-formed Conventional Commits message. Use as a slash command before every commit."
tools: [execute, read]
---

# Write Commit Message

You are a senior engineer writing a precise, informative git commit message. Your output must follow the **Conventional Commits** specification and be ready to paste directly into the terminal.

---

## Input

Run the following command and use its output as the diff to analyse:

```bash
git diff --staged
```

If the diff is empty (nothing staged), say so and stop — do not generate a message for an empty diff.

---

## Rules

### Format

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

All three sections are governed by the rules below.

### Type

Choose the **single most accurate** type:

| Type       | Use when                                                |
| ---------- | ------------------------------------------------------- |
| `feat`     | A new feature visible to users or callers               |
| `fix`      | A bug fix                                               |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf`     | Performance improvement                                 |
| `test`     | Adding or updating tests only                           |
| `docs`     | Documentation only (comments, README, .md files)        |
| `style`    | Formatting, whitespace — no logic change                |
| `chore`    | Build process, dependency updates, config changes       |
| `ci`       | CI/CD pipeline changes                                  |
| `revert`   | Reverts a previous commit                               |

### Scope

The scope is the **area of the codebase** most affected, in lowercase kebab-case:

- Derive it from the changed file paths (e.g. `alerts`, `auth`, `db-schema`, `api-webhooks`, `ui-button`)
- If changes span many unrelated areas, omit the scope — do not use `*` or `various`
- Keep it to 1–3 words

### Subject

- Imperative present tense: "add", "fix", "remove" — not "added", "fixes", "removing"
- No capital first letter (unless a proper noun)
- No period at the end
- Max 72 characters total for the first line (type + scope + subject)
- Describe **what** changed, not **how** it was implemented

### Body (optional but recommended for non-trivial changes)

Include a body when:

- The _why_ behind the change is not obvious from the subject
- There are important caveats, trade-offs, or migration notes
- Multiple distinct logical changes are bundled in one commit

Format:

- Separate from subject with a blank line
- Wrap at 72 characters per line
- Use plain prose or a short bullet list

### Footer (optional)

Include footers for:

- Issue/ticket references: `Closes PROJ-123`, `Fixes #42`, `Refs #100`
- Breaking changes: `BREAKING CHANGE: <description of what breaks and how to migrate>`

---

## Process

1. Read the full staged diff.
2. Identify all changed files and group them by logical area.
3. **Detect a ticket ID from the current branch name:**
   Run `git branch --show-current` and inspect the output. If the branch name contains a ticket ID pattern (e.g. `feat/proj-123-...`, `fix/lin-456-...`, `chore/abc-789-...`), extract the ID (e.g. `PROJ-123`, `LIN-456`, `ABC-789`) and include it as a `Closes` footer automatically. Do not ask the user — just include it.
4. Determine whether this is one coherent change or multiple unrelated changes:
   - **One coherent change** → produce one commit message.
   - **Multiple unrelated changes** → warn the user and produce a separate proposed message for each logical group, then recommend splitting the commit with `git add -p`.
5. Apply all rules above to produce the message(s).
6. Output the result in a fenced code block so it is easy to copy.

---

## Output Format

```
<type>(<scope>): <subject>

<body if needed>

<footers if needed>
```

After the code block, add a one-line explanation of your type and scope choices if they are non-obvious.

**Do not** add any other commentary, suggestions, or questions unless you detected multiple unrelated changes (Step 3).

---

## Examples

**Simple fix:**

```
fix(alerts): prevent duplicate toast on rapid resubmit
```

**Feature with body:**

```
feat(exports): add CSV export to alerts table

Adds a server action that streams a CSV file for the current
filtered alert set. Uses the Web Streams API to avoid loading
the full result set into memory for large exports.

Closes PROJ-456
```

**Breaking change:**

```
refactor(auth): replace custom session with NextAuth v5

BREAKING CHANGE: the `getSession()` helper now returns the NextAuth
Session type. Callers must update destructuring — `session.user.id`
replaces `session.userId`.
```

**Multiple unrelated changes detected:**

```
⚠️  The staged diff contains changes to unrelated areas:
  1. src/lib/actions/alerts.ts — bug fix in rate limit check
  2. prisma/schema.prisma     — new UserPreferences model

Proposed messages if split:

--- Commit 1 ---
fix(alerts): correct off-by-one in rate limit window check

--- Commit 2 ---
chore(db-schema): add UserPreferences model

Consider running `git add -p` to stage and commit them separately.
```
