# Project-Specific Patterns

<!-- Fill this file with conventions, patterns, and decisions that are unique to this project.
     Copilot will load this file alongside the generic best-practice references.
     Delete placeholder sections that don't apply and add new ones as the project grows. -->

---

## 1. Naming Conventions

<!-- [PROJECT_NAMING]: Document any project-specific naming rules.
     Examples:
     - Route handler files are always named `route.ts`, never `api.ts`.
     - Database model names are singular PascalCase (User, Alert, Invoice).
     - React component files match the component name exactly (UserCard.tsx exports `UserCard`).
-->

---

## 2. Auth Patterns

<!-- [AUTH_PATTERNS]: Describe how authentication and authorisation are implemented.
     Examples:
     - Session is accessed via `auth()` from `src/lib/auth.ts`.
     - Role check helper: `requireRole(session, "ADMIN")` throws if the role doesn't match.
     - Org-scoped queries always include `orgId: session.user.orgId` in the where clause.
-->

---

## 3. Feature Flag Patterns

<!-- [FEATURE_FLAGS]: If the project uses feature flags, document the pattern here.
     Examples:
     - Flags are defined in `src/lib/flags.ts` and evaluated server-side only.
     - Use `isEnabled("flag-name", userId)` — never expose raw flag values to the client.
-->

---

## 4. Multi-tenancy / Org Scoping

<!-- [MULTITENANCY]: If the project is multi-tenant, document scoping rules.
     Examples:
     - Every query must include `organizationId` derived from the session.
     - A Prisma middleware enforces org scoping and throws on missing `organizationId`.
-->

---

## 5. Third-party Integrations

<!-- [INTEGRATIONS]: Document how external services are called.
     Examples:
     - Stripe webhooks are verified in `src/app/api/webhooks/stripe/route.ts`.
     - All Resend calls go through `src/lib/email/send.ts` — never call the SDK directly.
     - S3 uploads use the helper in `src/lib/storage/upload.ts` which enforces allowed MIME types.
-->

---

## 6. Shared UI Patterns

<!-- [UI_PATTERNS]: Document recurring UI patterns specific to this project.
     Examples:
     - All data tables use `<DataTable columns={} data={} />` from `src/components/ui/data-table.tsx`.
     - Page headers use `<PageHeader title="" description="" actions={} />`.
     - All modals are triggered via `useModal()` from `src/hooks/use-modal.ts`.
-->

---

## 7. Testing Patterns

<!-- [TEST_PATTERNS]: Document how tests are structured for this project.
     Examples:
     - Server Action tests use a shared `createMockSession()` helper from `tests/helpers/auth.ts`.
     - Database tests use a seeded test database reset between runs via `tests/setup.ts`.
     - E2E tests authenticate via `tests/fixtures/auth.fixture.ts`.
-->

---

## 8. Other Project-specific Rules

<!-- Add any additional conventions that don't fit the sections above. -->
