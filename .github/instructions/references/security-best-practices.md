# Security Best Practices

Apply this reference for any work touching authentication, data handling, HTTP, or external integrations. Covers OWASP Top 10 and Next.js-specific security concerns.

---

## 1. Input Validation & Sanitization

### Validate at every boundary

```ts
// Every Server Action and Route Handler must validate with Zod before DB access
const schema = z.object({
  name: z.string().min(1).max(100).trim(),
  email: z.string().email().toLowerCase(),
  age: z.number().int().min(0).max(150),
});
```

### Never trust client-supplied IDs

```ts
// ❌ Trusts client — another user could delete someone else's record
await prisma.post.delete({ where: { id: input.postId } });

// ✅ Scoped to authenticated user — enforces ownership
await prisma.post.delete({
  where: { id: input.postId, authorId: session.user.id },
});
```

### Sanitize rich text / HTML

Never render untrusted HTML directly. If the app accepts HTML input (e.g. rich text editors), sanitize with a library like `dompurify` before storing or rendering:

```ts
import DOMPurify from "isomorphic-dompurify";
const safe = DOMPurify.sanitize(userHtml, {
  ALLOWED_TAGS: ["b", "i", "a", "p"],
});
```

---

## 2. Authentication & Session Security

- Always check session at the **top** of Server Actions and Route Handlers — before any business logic.
- Session tokens must be `HttpOnly`, `Secure`, `SameSite=Lax` (or `Strict`). Next-Auth/Auth.js handles this by default — do not override these cookie flags.
- Rotate session tokens on privilege change (login, role change, password reset).
- Never store sensitive values (raw passwords, tokens, PII) in `localStorage` or `sessionStorage` — they are accessible to JavaScript.

---

## 3. CSRF Protection

Next.js Server Actions are protected against CSRF by default via the `Origin` header check enforced by the framework. **Do not bypass this.**

Edge cases to watch:

- **Route Handlers (`app/api/`)** are NOT automatically CSRF-protected. For state-changing endpoints that use cookie-based auth, verify the `Origin` or use a CSRF token:
  ```ts
  const origin = req.headers.get("origin");
  if (origin !== process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  ```
- **Webhook handlers** must verify the provider's signature instead (see section 7).
- Never set `SameSite=None` on session cookies without a documented reason.

---

## 4. HTTP Security Headers

Set these headers on all responses. Configure in `next.config.ts`:

```ts
const securityHeaders = [
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" }, // Clickjacking
  { key: "X-Content-Type-Options", value: "nosniff" }, // MIME sniffing
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // tighten once inline scripts are removed
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self'",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
];
```

- **Do not** set `X-Powered-By: Next.js` (disabled by default in Next.js).
- Review and tighten CSP `script-src` once the app is stable — `'unsafe-inline'` is a temporary starting point.

---

## 5. Secret Management

- All secrets live in environment variables only — never hardcoded in source.
- Server-only secrets must **never** have the `NEXT_PUBLIC_` prefix.
- Use `server-only` import in files that access secrets to enforce a build-time error if accidentally imported client-side:
  ```ts
  import "server-only";
  ```
- Rotate secrets immediately if they are accidentally committed or logged.
- `.env` is git-ignored. `.env.example` contains only placeholder values — no real credentials.

---

## 6. Rate Limiting

Apply rate limiting at multiple layers:

| Layer             | Target                         | Tool                             |
| ----------------- | ------------------------------ | -------------------------------- |
| Edge / CDN        | All traffic                    | Vercel WAF, Cloudflare           |
| Route Handler     | Per IP, per user               | <!-- [RATE_LIMIT_HELPER] -->     |
| Auth endpoints    | Login, sign-up, password reset | Stricter limits (e.g. 5 req/min) |
| API key endpoints | Per key                        | Per-key bucket                   |

Respond with `429 Too Many Requests` and include a `Retry-After` header:

```ts
return NextResponse.json(
  { error: "Too many requests" },
  {
    status: 429,
    headers: { "Retry-After": "60" },
  },
);
```

---

## 7. Webhook Security

```ts
export async function POST(req: NextRequest) {
  const rawBody = await req.text(); // Must be raw text, not parsed JSON
  const sig = req.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch (err) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  // Safe to process event now
}
```

- Always use the provider's signature verification — never trust the payload without it.
- Log unrecognized event types but return `200` to avoid webhook retries for unknown events.
- Process webhooks idempotently — providers may deliver the same event more than once.

---

## 8. SQL Injection & Query Safety

Prisma's query builder is parameterized by default — standard queries are safe. Risks arise from:

```ts
// ❌ Raw SQL with string interpolation — SQL injection risk
await prisma.$queryRawUnsafe(`SELECT * FROM users WHERE name = '${name}'`);

// ✅ Parameterized raw SQL (only when Prisma ORM cannot express the query)
await prisma.$queryRaw`SELECT * FROM users WHERE name = ${name}`;
```

Never use `$queryRawUnsafe` with user-supplied input.

---

## 9. Dependency Security

- Run `npm audit` in CI and block deploys on high-severity findings.
- Keep dependencies up to date — pin major versions, auto-update patches via Dependabot or Renovate.
- Avoid packages with: no recent maintenance, single maintainer, or install-time scripts from unknown authors.
- Review `postinstall` scripts in `package.json` of new dependencies before installing.

---

## 10. Error Exposure

Never return internal error details to clients:

```ts
// ❌ Leaks DB structure and query details
catch (err) {
  return NextResponse.json({ error: err.message }, { status: 500 });
}

// ✅ Generic message to client, full detail to server logs
catch (err) {
  logger.error("Operation failed", { err, userId: session?.user.id });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

Ensure your logger is configured to redact sensitive fields (passwords, tokens, card numbers) before writing to any log sink.
