# Data Security Anti-patterns (Injection, Crypto, Integrity)

Apply this checklist to Server Actions, Route Handlers, Prisma queries, and any component that handles user-supplied input or sensitive data.

> **Project teams:** Update the `<!-- PROJECT: -->` sections to reflect your specific data model, sensitive fields, and third-party integrations.

---

## A02 — Cryptographic Failures

### 2a. Secret exposed via NEXT*PUBLIC* prefix

**Pattern:** An environment variable containing a secret (API key, private key, token) uses the `NEXT_PUBLIC_` prefix, which bundles it into client-side JavaScript.
**Detection:** Grep all `NEXT_PUBLIC_` env var usages. Flag any that sound like secrets: `KEY`, `SECRET`, `TOKEN`, `PRIVATE`, `PASSWORD`.
**Impact:** Critical — the secret is shipped to every browser that loads the app.
**Fix:** Remove the `NEXT_PUBLIC_` prefix. Access server-only values exclusively in Server Components, Server Actions, and Route Handlers.

### 2b. Sensitive data returned to the client unnecessarily

**Pattern:** A Server Action or Route Handler returns a full Prisma model that includes sensitive fields (e.g. `password`, `hashedPassword`, `twoFactorSecret`, `stripeCustomerId`).
**Detection:** Find `return { success: true, data: user }` (or similar) and check whether the returned type contains any sensitive fields.
**Impact:** High — PII and credentials are exposed to the client and may be logged by browser devtools.
**Fix:** Map to a DTO before returning:

```ts
const { password, twoFactorSecret, ...safeUser } = user;
return { success: true, data: safeUser };
```

<!-- PROJECT: list the model fields that must never leave the server (e.g. `hashedPassword`, `stripeCustomerId`) -->

### 2c. Password stored without hashing

**Pattern:** A password is stored in the database as plaintext or with a weak algorithm (MD5, SHA-1).
**Detection:** Search for `prisma.user.create` / `prisma.user.update` where a `password` field is set directly from input without passing through `bcrypt`, `argon2`, or similar.
**Impact:** Critical — a database breach exposes all user credentials in plaintext.
**Fix:**

```ts
import { hash } from "bcryptjs";
const hashedPassword = await hash(input.password, 12);
await prisma.user.create({ data: { ...rest, password: hashedPassword } });
```

---

## A03 — Injection

### 3a. Input not validated with Zod before DB access

**Pattern:** A Server Action or Route Handler uses `input` (from `FormData`, request body, or query params) directly in a Prisma query without parsing through a Zod schema first.
**Detection:** Trace the data path from entry point to `prisma.*` call. If there is no `schema.safeParse(input)` or `schema.parse(input)` between them, flag it.
**Impact:** High — malformed input can corrupt data or trigger unexpected DB behaviour.
**Fix:**

```ts
const parsed = schema.safeParse(input);
if (!parsed.success)
  return { success: false, error: parsed.error.issues[0].message };
// use parsed.data below, never raw input
```

### 3b. Raw SQL with user input interpolation

**Pattern:** `prisma.$queryRaw` or `prisma.$executeRaw` used with a template literal that interpolates user-supplied values.
**Detection:** Search for `$queryRaw` and `$executeRaw`. Check whether the template literal contains variables that originate from user input (not hardcoded column names or enum values).
**Impact:** Critical — SQL injection.
**Fix:** Use Prisma's `sql` tagged template or parameterised placeholders:

```ts
// ❌
await prisma.$queryRaw`SELECT * FROM "User" WHERE email = '${input.email}'`;

// ✅
import { sql } from "@prisma/client";
await prisma.$queryRaw(sql`SELECT * FROM "User" WHERE email = ${input.email}`);
```

### 3c. dangerouslySetInnerHTML with unsanitized input

**Pattern:** `dangerouslySetInnerHTML={{ __html: value }}` where `value` comes from user input or the database without sanitization.
**Detection:** Search for `dangerouslySetInnerHTML`. Trace the value back to its source. If it can be user-authored, flag it.
**Impact:** Critical — stored or reflected XSS.
**Fix:**

```ts
import DOMPurify from "isomorphic-dompurify";
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(content) }} />
```

---

## A08 — Software and Data Integrity Failures

### 8a. Webhook payload not signature-verified

**Pattern:** A webhook Route Handler processes the request body without verifying the provider's cryptographic signature.
**Detection:** Find webhook handlers (e.g. `app/api/webhooks/`). Check that they read the raw body and verify it against the provider's secret before any processing.
**Impact:** Critical — attacker can forge webhook events (e.g. fake a successful payment).
**Fix (Stripe example):**

```ts
const sig = req.headers.get("stripe-signature")!;
const event = stripe.webhooks.constructEvent(
  rawBody,
  sig,
  process.env.STRIPE_WEBHOOK_SECRET!,
);
```

<!-- PROJECT: list all webhook providers and the header/method used for each -->

### 8b. File upload not validated server-side

**Pattern:** File uploads are accepted without server-side MIME type or size validation (client-side validation only, or no validation at all).
**Detection:** Find file upload handlers. Check for MIME type checks against an allowlist and a maximum byte size check server-side.
**Impact:** High — malicious files can be uploaded (polyglots, oversized files for DoS).
**Fix:**

```ts
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE = 5 * 1024 * 1024; // 5 MB

if (!ALLOWED_TYPES.includes(file.type))
  return { success: false, error: "Invalid file type" };
if (file.size > MAX_SIZE) return { success: false, error: "File too large" };
```

<!-- PROJECT: specify allowed MIME types and maximum file sizes per upload context -->
