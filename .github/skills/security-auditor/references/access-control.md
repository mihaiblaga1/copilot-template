# Access Control & Authentication Anti-patterns

Apply this checklist to every Server Action, Route Handler, middleware, and page that handles user identity or protected resources.

> **Project teams:** Add project-specific role names, permission helpers, and auth utility paths in the sections marked `<!-- PROJECT: -->`.

---

## A01 — Broken Access Control

### 1a. Missing session check before business logic

**Pattern:** A Server Action or Route Handler performs a database read/write before verifying the session.
**Detection:** Read the function top-to-bottom. If any `prisma.*` call, external HTTP request, or state mutation appears before `getServerSession()` / `auth()` returns a non-null user, it is a violation.
**Impact:** Critical — unauthenticated callers can trigger privileged operations.
**Fix:**

```ts
export async function deletePost(input: unknown) {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  // business logic only below this line
}
```

<!-- PROJECT: document the auth helper used in this project, e.g. `auth()` from `src/lib/auth.ts` -->

### 1b. Client-supplied ID trusted without ownership check

**Pattern:** A query uses an ID from user input without scoping it to the authenticated user.
**Detection:** Look for `where: { id: input.id }` (or similar) without an additional `userId`, `authorId`, or `organizationId` constraint derived from the session.
**Impact:** Critical — user A can read, modify, or delete user B's records (IDOR).
**Fix:**

```ts
// ❌
await prisma.post.delete({ where: { id: input.postId } });

// ✅
await prisma.post.delete({
  where: { id: input.postId, authorId: session.user.id },
});
```

<!-- PROJECT: if the project uses org-scoping, all queries must also include `organizationId: session.user.orgId` -->

### 1c. Role check missing on privileged action

**Pattern:** An action that should be admin-only checks only that a session exists, not the user's role.
**Detection:** Search for admin-scoped functionality (delete all, impersonate, billing, user management). Verify there is an explicit role check after the session check.
**Impact:** High — any authenticated user can perform admin operations.
**Fix:**

```ts
if (session.user.role !== "ADMIN")
  return { success: false, error: "Forbidden" };
```

<!-- PROJECT: list privileged roles and the helper used for role checks, e.g. `requireRole(session, "ADMIN")` -->

### 1d. Route not protected by middleware

**Pattern:** A dashboard or settings page is accessible without authentication because it is not covered by the proxy/middleware matcher.
**Detection:** Check `src/proxy.ts` or `middleware.ts` matcher config. Compare protected path patterns against all `app/(dashboard)/` and `app/(admin)/` routes.
**Impact:** High — server-rendered pages may expose sensitive data to unauthenticated visitors.
**Fix:** Add the route segment to the middleware matcher, or add an explicit redirect at the top of the layout.

<!-- PROJECT: document the middleware file path and matcher pattern used in this project -->

---

## A07 — Identification and Authentication Failures

### 7a. No rate limit on credential auth endpoint

**Pattern:** A sign-in or password-reset Route Handler has no rate limiting.
**Detection:** Search `app/api/auth/` for the credentials handler. Check for rate-limit middleware (e.g. `upstash/ratelimit`, `express-rate-limit`, custom Redis guard). Flag if absent.
**Impact:** High — credential stuffing and brute-force attacks are unrestricted.
**Fix:** Apply a rate limiter at the top of the handler:

```ts
const { success } = await ratelimit.limit(ip);
if (!success)
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
```

<!-- PROJECT: document the rate-limit library and Redis connection used in this project -->

### 7b. Session not invalidated on logout

**Pattern:** The logout action only clears the client-side cookie but does not revoke the session server-side.
**Detection:** Find the sign-out handler. If it only calls `signOut()` from NextAuth with no server-side session deletion, flag it for review.
**Impact:** Medium — stolen session cookies remain valid until natural expiry.
**Fix:** Ensure the auth provider's session store is updated on logout (NextAuth handles this automatically for database sessions — flag only if using JWT strategy without a denylist).

### 7c. Sensitive token returned in URL

**Pattern:** A password-reset or email-verification token is passed as a plain query parameter.
**Detection:** Search for `?token=` in redirect calls, `router.push`, and `redirect()`. If a token is in a URL, check whether it is logged by Next.js telemetry or third-party analytics.
**Impact:** Medium — tokens can leak via `Referer` headers and server logs.
**Fix:** Use short-lived tokens stored in the database and look them up by a random nonce, or transmit via `POST` body only.
