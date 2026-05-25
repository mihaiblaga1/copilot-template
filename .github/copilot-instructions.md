# Project Context & Rules

## Business Overview

<!-- [PROJECT_NAME]: Describe the product in 2-3 sentences. What problem does it solve? Who are the primary users? -->
<!-- Example: "A SaaS platform that helps engineering teams track on-call incidents in real time." -->

## Tech Stack

- **Framework:** Next.js 16 (App Router, React 19).
- **Database:** PostgreSQL via Prisma ORM.
- **Communication:** Standardized Server Actions + custom `useServerAction` hook.
- **UI:** Radix UI (shadcn/ui style), Tailwind CSS, Lucide icons, Sonner toasts.
- **Auth:** <!-- [AUTH_PROVIDER]: e.g. NextAuth.js, Clerk, Auth.js, Lucia -->
- **Email:** <!-- [EMAIL_PROVIDER]: e.g. Resend, Nodemailer, SendGrid -->
- **Payments:** <!-- [PAYMENTS_PROVIDER]: e.g. Stripe, Paddle, Lemon Squeezy — or "N/A" -->
- **Storage:** <!-- [STORAGE_PROVIDER]: e.g. Vercel Blob, AWS S3, Cloudflare R2 — or "N/A" -->
- **Deployment:** <!-- [DEPLOYMENT_PLATFORM]: e.g. Vercel, Railway, Fly.io -->

## Project Structure

```
src/
├── app/                    # Next.js App Router pages & layouts
│   ├── (marketing)/        # Public-facing pages (landing, pricing, etc.)
│   ├── (auth)/             # Auth pages (sign-in, sign-up, etc.)
│   └── (dashboard)/        # Authenticated app shell
│       └── [feature]/      # Feature-specific routes
├── components/
│   ├── ui/                 # Base shadcn/ui primitives (Button, Input, etc.)
│   └── [feature]/          # Feature-scoped components
├── lib/
│   ├── actions/            # Server Actions (one file per domain)
│   ├── db/                 # Prisma client singleton & query helpers
│   └── utils/              # Pure utility functions (no side effects)
├── hooks/                  # Client-side hooks (useServerAction, etc.)
└── types/                  # Shared TypeScript types & Zod schemas
```

<!-- [PROJECT_STRUCTURE_NOTES]: Add any deviations from the structure above. -->

## Architectural Standards (Mandatory)

### 1. Server Actions

- Every Server Action lives in `src/lib/actions/<domain>.ts`.
- Actions must return a typed result object — never throw to the client:
  ```ts
  type ActionResult<T> =
    | { success: true; data: T }
    | { success: false; error: string };
  ```
- Validate all inputs with **Zod** before touching the database.
- Use `revalidatePath` / `revalidateTag` for cache invalidation after mutations.

### 2. Frontend Consumption

- Use the custom `useServerAction` hook for all Server Action calls from Client Components.
- Do **not** call Server Actions directly in `useEffect`. Use the hook's `execute` function.
- Loading, error, and success states are managed by the hook — do not duplicate them locally.

### 3. Data Fetching

- Prefer **async Server Components** for initial data fetching (no `useEffect` for page-load data).
- Use `Suspense` boundaries with skeleton fallbacks for async Server Components.
- Never expose raw Prisma models to the client — map to DTO types before returning.

### 4. Authentication & Authorization

- Protect routes via proxy (`src/proxy.ts`) — never rely solely on UI-level guards.
- Use the session helper (e.g. `getServerSession`, `auth()`) at the top of every Server Action that requires a user.
- <!-- [AUTH_NOTES]: Add any project-specific auth rules (role checks, org scoping, etc.) -->

### 5. Database

- All schema changes go through **Prisma Migrate** (`prisma migrate dev`).
- Never write raw SQL unless Prisma cannot express the query; document why if you do.
- Soft-delete records with a `deletedAt DateTime?` field instead of hard-deleting.
- <!-- [DB_NOTES]: Add any project-specific database conventions (multi-tenancy, RLS, etc.) -->

### 6. Error Handling

- Use a centralized error-logging utility (e.g. Sentry, Axiom) — never just `console.error` in production code.
- Server Actions must catch all thrown errors and return `{ success: false, error: "..." }`.
- Client components surface errors via Sonner toast, never via `alert()`.

## UI & Component Standards

- **Component library:** shadcn/ui primitives in `src/components/ui/`. Do not modify generated files directly — extend via composition.
- **Styling:** Tailwind CSS utility classes only. No inline `style={{}}` unless for dynamic values impossible in Tailwind.
- **Icons:** Lucide React exclusively. Do not import from other icon libraries.
- **Theming:** Colors are defined as CSS variables in `globals.css`. Reference them via Tailwind (`bg-background`, `text-foreground`, etc.), never hardcode hex values.
- **Responsiveness:** Mobile-first. All layouts must be usable on screens ≥ 375 px wide.
- **Accessibility:** Interactive elements must have accessible labels (`aria-label`, `aria-describedby`, or visible text). Use semantic HTML (`<button>`, `<nav>`, `<main>`, etc.).
- <!-- [UI_NOTES]: Add any project-specific design tokens, component overrides, or Figma links. -->

## UX Microcopy Standards

- **Toast Titles:** Use "Passive Past Tense" for success messages (e.g., "Alert Muted", "User Invited").
- **Error Messages:** Avoid "Something went wrong." Be specific: "Failed to fetch pricing: Database connection timeout."
- **Empty States:** Every new dashboard view must include a call-to-action in its `<EmptyState />` (e.g., "No alerts found. [Create Alert]").
- **Confirmation Dialogs:** Destructive actions (delete, revoke, reset) must use a `<ConfirmDialog />` with a clear description of consequences.
- **Loading States:** Use skeleton components that match the shape of the loaded content, not generic spinners.

## Security Rules

- Never expose secret environment variables to the client (`NEXT_PUBLIC_` prefix is for public values only).
- Sanitize and validate every value that touches the database — even from authenticated users.
- Apply CSRF protection to all mutating Server Actions (Next.js handles this by default via the `Server Action` boundary, but document any exceptions).
- Rate-limit auth endpoints and any unauthenticated public API routes.

## Testing

- <!-- [TESTING_FRAMEWORK]: e.g. Vitest + React Testing Library, Jest, Playwright for E2E -->
- Unit tests live in `__tests__/` next to the file under test, or in a top-level `tests/` directory.
- Write tests for all Server Actions and critical utility functions.
- E2E tests cover the happy path for each major user flow.

## Environment Variables

All required environment variables must be documented in `.env.example`. Never commit `.env`.

```
# App
NEXT_PUBLIC_APP_URL=

# Database
DATABASE_URL=

# Auth — [AUTH_PROVIDER]
# [AUTH_ENV_VARS]

# Email — [EMAIL_PROVIDER]
# [EMAIL_ENV_VARS]

# Payments — [PAYMENTS_PROVIDER]
# [PAYMENTS_ENV_VARS]

# Storage — [STORAGE_PROVIDER]
# [STORAGE_ENV_VARS]
```

## Reference Files

Before writing or reviewing code, load the relevant reference file(s) for the area you are working in. Each file contains concrete rules, patterns, and examples.

| Area                         | Reference                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Project description**      | [project-description.md](./project-description.md)                                                         |
| React components & hooks     | [react-best-practices.md](./instructions/references/react-best-practices.md)                               |
| Next.js App Router & routing | [nextjs-best-practices.md](./instructions/references/nextjs-best-practices.md)                             |
| Server Actions               | [server-actions-best-practices.md](./instructions/references/server-actions-best-practices.md)             |
| API Route Handlers           | [api-route-best-practices.md](./instructions/references/api-route-best-practices.md)                       |
| Database & Prisma            | [db-best-practices.md](./instructions/references/db-best-practices.md)                                     |
| Accessibility (WCAG 2.1 AA)  | [accessibility-best-practices.md](./instructions/references/accessibility-best-practices.md)               |
| Security (OWASP / headers)   | [security-best-practices.md](./instructions/references/security-best-practices.md)                         |
| Project-specific patterns    | [project-patterns.md](./instructions/references/project-patterns.md)                                       |

Always load **project-description.md** first — it provides product context and domain knowledge that informs every decision. Always load **project-patterns.md** for any feature work — it contains project-specific conventions that override the generic references above.

## Copilot Behavior Notes

- When generating a new feature, always scaffold: Server Action → hook/data-fetch → Server Component → Client Component (if interactivity is needed).
- Prefer explicit types over `any`. Never use `as unknown as X` to silence type errors.
- When in doubt about where to place a file, follow the project structure above and ask before deviating.
- Do not add dependencies without noting them in a comment — the user may need to `npm install` them.
