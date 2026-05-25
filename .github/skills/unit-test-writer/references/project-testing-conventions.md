# Project Testing Conventions

<!-- Fill this file with project-specific testing setup. The unit-test-writer skill loads this
     before generating any tests. Delete placeholder sections that don't apply and add new ones
     as the project grows. -->

---

## 1. Test Runner & Libraries

<!-- [TESTING_FRAMEWORK]: Specify the test runner and assertion/render libraries in use.
     Examples:
     - Test runner: Vitest
     - Component rendering: @testing-library/react
     - Assertions: Vitest expect (compatible with Jest matchers)
     - E2E: Playwright (separate — not covered by this skill)
-->

---

## 2. Running Tests

<!-- [TEST_COMMANDS]: Document the commands used to run tests.
     Examples:
       npm run test          # watch mode
       npm run test:run      # single run (CI)
       npm run test:coverage # with coverage report
-->

---

## 3. Prisma / Database Mocking

<!-- [DB_MOCK]: Describe how Prisma is mocked in tests.
     Example using vitest-mock-extended:

     // tests/helpers/prisma.ts
     import { mockDeep, mockReset } from "vitest-mock-extended";
     import type { PrismaClient } from "@prisma/client";
     vi.mock("@/lib/db/client", () => ({ prisma: mockDeep<PrismaClient>() }));

     Import in tests:
     import { prisma } from "@/lib/db/client";
     beforeEach(() => mockReset(prisma));
     prisma.user.create.mockResolvedValue({ id: "1", name: "Alice", email: "alice@example.com" });
-->

---

## 4. Auth / Session Mocking

<!-- [AUTH_MOCK]: Describe how the auth session is mocked.
     Example:
     vi.mock("@/lib/auth", () => ({ auth: vi.fn() }));
     import { auth } from "@/lib/auth";

     // Authenticated:
     (auth as Mock).mockResolvedValue({ user: { id: "user-1", role: "USER" } });

     // Unauthenticated:
     (auth as Mock).mockResolvedValue(null);
-->

---

## 5. Shared Test Helpers

<!-- [TEST_HELPERS]: Document reusable factory functions or fixtures.
     Examples:
     - createMockUser(overrides?) — returns a valid User object with sensible defaults
     - createMockSession(overrides?) — returns a valid Session object
     - renderWithProviders(ui) — wraps the component in all required React context providers

     Location: tests/helpers/
-->

---

## 6. Environment Variables in Tests

<!-- [TEST_ENV]: Describe how env vars are handled.
     Example:
     - A `tests/.env.test` file is loaded automatically by the test runner setup.
     - Never use real API keys in tests — use placeholder values like "test-key".
     - DATABASE_URL in tests points to a dedicated test database or is fully mocked.
-->

---

## 7. File & Import Aliases

<!-- [ALIASES]: List any path aliases the test runner must resolve.
     Example:
     - "@/" maps to "src/" — configured in vitest.config.ts via `resolve.alias`.
-->

---

## 8. Other Project-Specific Rules

<!-- Add any additional testing rules or patterns specific to this project. -->
