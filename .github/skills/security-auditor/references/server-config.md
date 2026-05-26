# Server Configuration & Infrastructure Anti-patterns

Apply this checklist to `next.config.ts`, Route Handlers, middleware, and any server-side code that deals with HTTP, logging, or external service calls.

> **Project teams:** Update the `<!-- PROJECT: -->` sections with your deployment platform, logging provider, and approved external domains.

---

## A04 — Insecure Design

### 4a. Internal error details leaked to client

**Pattern:** A Server Action or Route Handler catches an exception and returns the raw error message or stack trace to the client.
**Detection:** Search for `catch (e)` blocks that do `return { error: e.message }` or `return { error: String(e) }`.
**Impact:** High — stack traces and DB error messages reveal schema structure, file paths, and library versions to attackers.
**Fix:**

```ts
} catch (e) {
  // ✅ Log internally, return generic message externally
  logger.error("createPost failed", { error: e, userId: session.user.id });
  return { success: false, error: "Failed to create post. Please try again." };
}
```

<!-- PROJECT: document the logging utility (e.g. Sentry, Axiom, Pino) — never use console.error in production -->

### 4b. Business-rule quota not enforced server-side

**Pattern:** A plan-tier or usage limit (e.g. "max 5 alerts on free plan") is only enforced in the UI, with no corresponding check in the Server Action.
**Detection:** Search the codebase for UI-level quota checks (conditional rendering, disabled buttons). Verify a matching check exists in the corresponding action.
**Impact:** High — API-aware users or intercepted requests bypass limits.
**Fix:**

```ts
const count = await prisma.alert.count({ where: { userId: session.user.id } });
if (count >= 5 && session.user.plan === "FREE") {
  return { success: false, error: "Free plan is limited to 5 alerts." };
}
```

<!-- PROJECT: list all business-rule limits that must be enforced server-side -->

### 4c. Soft-deleted records still queryable

**Pattern:** Soft-delete is implemented via `deletedAt DateTime?` but queries do not filter `deletedAt: null`, making deleted records accessible via direct API calls.
**Detection:** Search for `prisma.*.findMany` / `findFirst` / `findUnique` on soft-deleted models. Verify each includes `where: { deletedAt: null }` (or a Prisma middleware that adds it globally).
**Impact:** Medium — deleted data (potentially including PII) is still accessible.
**Fix:** Add a global Prisma middleware or confirm every query on soft-deletable models filters `deletedAt: null`.

<!-- PROJECT: list models that use soft-delete (`deletedAt` field) -->

---

## A05 — Security Misconfiguration

### 5a. HTTP security headers missing

**Pattern:** `next.config.ts` does not set security-critical response headers.
**Detection:** Read `next.config.ts`. Check for `headers()` export and verify the following are present: `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `Content-Security-Policy`.
**Impact:** Medium — missing headers enable clickjacking, MIME sniffing, and cross-origin data leaks.
**Fix:** Add to `next.config.ts`:

```ts
async headers() {
  return [{
    source: "/(.*)",
    headers: [
      { key: "X-Frame-Options", value: "SAMEORIGIN" },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
    ],
  }];
}
```

<!-- PROJECT: add the full CSP policy here once approved -->

### 5b. Unused HTTP methods exported from Route Handler

**Pattern:** A Route Handler exports method handlers (e.g. `GET`, `PUT`) that are not used by any known consumer.
**Detection:** List all exported method functions in each `route.ts`. Cross-reference with API consumers (client code, webhook providers, third-party services). Flag unused exports.
**Impact:** Low — expands attack surface unnecessarily.
**Fix:** Remove unused method exports. Only export the methods the handler intentionally supports.

### 5c. CORS not restricted on public-facing Route Handlers

**Pattern:** A Route Handler that mutates state or returns sensitive data does not restrict `Access-Control-Allow-Origin`.
**Detection:** Search for `'Access-Control-Allow-Origin': '*'` in Route Handlers that require auth or perform mutations.
**Impact:** High — any origin can make cross-site credentialed requests.
**Fix:** Restrict to the app's own origin:

```ts
const ALLOWED_ORIGIN = process.env.NEXT_PUBLIC_APP_URL!;
response.headers.set("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
```

---

## A09 — Security Logging and Monitoring Failures

### 9a. Auth failure not logged

**Pattern:** Sign-in failures, permission denials, and session errors are silently discarded or only logged with `console.error`.
**Detection:** Find the auth handler and every `return { success: false, error: "Unauthorized" }` / `status: 401` response. Check whether an error event is sent to the logging provider before returning.
**Impact:** Medium — failed attacks are invisible, making incident response impossible.
**Fix:**

```ts
logger.warn("Unauthorized access attempt", {
  userId: session?.user?.id ?? "anonymous",
  route: req.nextUrl.pathname,
  ip: req.headers.get("x-forwarded-for"),
});
```

### 9b. Sensitive operation not audit-logged

**Pattern:** Destructive or privileged operations (hard delete, role change, payment initiation, API key revocation) leave no audit trail.
**Detection:** Find actions that perform these operations. Verify each emits a structured log event or writes to an audit log table.
**Impact:** Medium — compliance failures (SOC 2, GDPR) and inability to investigate incidents.
**Fix:** Write an audit record before or after each sensitive operation.

<!-- PROJECT: document the audit log table/model name and fields (e.g. AuditLog: userId, action, resourceId, createdAt) -->

---

## A10 — Server-Side Request Forgery (SSRF)

### 10a. User-controlled URL used in server-side fetch

**Pattern:** A Server Action or Route Handler makes an HTTP request to a URL derived from user input without validating it against an allowlist.
**Detection:** Search for `fetch(` and `axios.get(` (or similar) in server-side code. Trace each URL argument back to its source. Flag any that could be user-influenced.
**Impact:** Critical — attacker can make the server request internal metadata endpoints (e.g. AWS IMDS `169.254.169.254`) or internal services.
**Fix:**

```ts
const ALLOWED_HOSTS = ["api.stripe.com", "api.github.com"];
const url = new URL(input.webhookUrl);
if (!ALLOWED_HOSTS.includes(url.hostname)) {
  return { success: false, error: "URL not allowed" };
}
```

<!-- PROJECT: list approved external domains that may appear in user-supplied URLs -->
