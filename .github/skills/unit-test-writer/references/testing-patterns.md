# Testing Patterns

Generic rules that apply to every test in this stack. These complement the project-specific conventions in `project-testing-conventions.md`.

---

## 1. The AAA Pattern (non-negotiable)

Every test must follow **Arrange → Act → Assert** with a blank line between each phase:

```ts
it("returns an error when the user is not authenticated", async () => {
  // Arrange
  mockAuth.mockResolvedValue(null);

  // Act
  const result = await createUser({
    name: "Alice",
    email: "alice@example.com",
  });

  // Assert
  expect(result).toEqual({ success: false, error: "Unauthorized" });
});
```

Never mix phases or assert inside the Act step.

---

## 2. What to Test

### ✅ Always test

- **All branches of conditional logic** — every `if`, `switch`, early return
- **Error paths** — what happens when a dependency throws, returns null, or rejects
- **Validation boundaries** — what inputs are accepted, what are rejected (and with what message)
- **Side effects that are part of the contract** — `revalidatePath` called after mutation, email sent after sign-up, event emitted after state change
- **Accessibility in components** — that interactive elements exist and are labelled

### ❌ Never test

- Internal variable names or intermediate state that isn't exposed
- The internal implementation of mocked dependencies (trust the mock)
- Framework behavior (Next.js routing, React reconciliation) — that's the framework's job
- Trivial passthrough functions with zero logic (`return x`)
- Private/unexported helpers unless they contain complex logic worth isolating

---

## 3. Mocking Strategy

### Mock at the boundary, not deep inside

Mock the outermost layer that crosses a system boundary:

| Boundary      | Mock target                                           |
| ------------- | ----------------------------------------------------- |
| Database      | `prisma` client methods                               |
| Auth          | `auth()` / `getServerSession()`                       |
| External HTTP | `fetch` or the SDK client (e.g. `resend.emails.send`) |
| Time          | `Date` / `Date.now`                                   |
| Randomness    | `Math.random`, `crypto.randomUUID`                    |
| Logger        | The logger module                                     |

### Do NOT mock the unit under test's own logic

If you find yourself mocking a function inside the file you're testing, the code needs to be refactored, not the test.

### Keep mocks minimal

Only mock the return values your test actually needs. Over-specifying mocks makes tests brittle and hides what's actually being tested.

---

## 4. Test Descriptions

Descriptions must read as plain sentences describing behaviour, not implementation:

```ts
// ❌ Bad — describes implementation
it("calls prisma.user.create with the correct args", ...);

// ✅ Good — describes behaviour from the caller's perspective
it("creates the user and returns its ID on success", ...);

// ✅ Good — error path
it("returns an error when the email is already taken", ...);
```

Use `describe` to group by symbol, then nested `describe` for scenario groupings if needed:

```ts
describe("createUser", () => {
  describe("when authenticated", () => {
    it("creates the user and returns its ID", ...);
    it("returns an error when the email is already taken", ...);
  });

  describe("when not authenticated", () => {
    it("returns an Unauthorized error", ...);
  });
});
```

---

## 5. Determinism

Tests must produce the same result every run:

- **No `Date.now()` or `new Date()` in assertions** — mock the date and assert the mocked value
- **No `Math.random()`** — mock it or use a seeded generator
- **No real network calls** — all HTTP, DB, and external service calls must be mocked
- **No test order dependency** — each test must be able to run in isolation; use `beforeEach` to reset shared state

---

## 6. Async Tests

- Always `await` async calls — never leave floating promises
- Use `async/await` over `.then()` chains for readability
- For hooks with async state updates, wrap in `act()` or use `waitFor()` from Testing Library

```ts
it("updates state after the action resolves", async () => {
  // Arrange
  mockAction.mockResolvedValue({ success: true, data: { id: "1" } });
  const { result } = renderHook(() => useMyHook());

  // Act
  await act(async () => {
    await result.current.execute({ name: "Alice" });
  });

  // Assert
  expect(result.current.data).toEqual({ id: "1" });
});
```

---

## 7. Coverage Targets

Aim for **full branch coverage** on:

- Server Actions (every return path)
- Utility functions with conditional logic
- Custom hooks (every state transition)

For React components, aim to cover every **user-visible interaction path**, not every render branch.

Do not chase 100% line coverage — a test that exists only to hit a line, with no meaningful assertion, is worse than no test.
