## What type of change is this?

<!-- Check all that apply -->

- [ ] `feat` — new user-facing feature
- [ ] `fix` — bug fix
- [ ] `refactor` — code change that doesn't fix a bug or add a feature
- [ ] `perf` — performance improvement
- [ ] `test` — adding or updating tests only
- [ ] `docs` — documentation only
- [ ] `chore` — build, tooling, or dependency change

---

## Description

<!-- What does this PR do? Link the problem it solves, not just the solution.
     If this closes a Linear ticket or GitHub issue, use "Closes #123" or "Fixes LIN-456". -->

Closes:

---

## How to test

<!-- Step-by-step instructions a reviewer can follow to verify this works correctly.
     Include any required seed data, environment variables, or feature flags. -->

1.
2.
3.

---

## Screenshots / recordings

<!-- Required for any change that touches the UI. Drag images or a screen recording here.
     Delete this section if the PR has no UI changes. -->

| Before | After |
| ------ | ----- |
|        |       |

---

## Checklist

<!-- The PR Reviewer agent enforces these automatically. Check them yourself first. -->

**All PRs**

- [ ] I have read the diff and it contains no unintended changes
- [ ] New environment variables are added to `.env.example`
- [ ] No secrets or credentials are hardcoded

**Server Actions** _(if `src/lib/actions/**` was changed)_

- [ ] Session verified at the top of every action
- [ ] All inputs validated with Zod
- [ ] Returns `ActionResult<T>` — never throws to the client
- [ ] `revalidatePath` / `revalidateTag` called after mutations
- [ ] Raw Prisma models are not returned — mapped to DTO types

**API Route Handlers** _(if `src/app/api/**` was changed)_

- [ ] Auth verified before any business logic
- [ ] CSRF origin check present for state-changing endpoints
- [ ] Webhook handlers verify the provider's signature

**Database** _(if `prisma/schema.prisma` or `src/lib/db/**` was changed)_

- [ ] Change applied via `prisma migrate dev`, not `prisma db push`
- [ ] Soft-delete used instead of hard-delete where applicable
- [ ] No N+1 queries introduced

**UI** _(if any component was added or changed)_

- [ ] Skeleton loading state — not a generic spinner
- [ ] Empty state includes a call-to-action
- [ ] Destructive actions are wrapped in `<ConfirmDialog />`
- [ ] Icon-only buttons have `aria-label`
