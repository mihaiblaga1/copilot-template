---
applyTo: "**/app/api/**"
---

# API Route Rules (`app/api/`)

Apply these rules whenever creating or editing Next.js Route Handlers in this directory.

## When to use a Route Handler vs. a Server Action

- **Server Action** — default choice for all mutations and data fetching triggered by UI interactions.
- **Route Handler** — use only when you need an HTTP-addressable endpoint: webhooks, OAuth callbacks, file downloads, streaming responses, or third-party integrations that call your server directly.

Do not create Route Handlers as a substitute for Server Actions.

---

## 1. File Structure

Every route must live in a `route.ts` file inside an appropriately named folder:

```
src/app/api/
├── webhooks/
│   └── stripe/
│       └── route.ts
├── auth/
│   └── callback/
│       └── route.ts
└── exports/
    └── [id]/
        └── route.ts
```

Export only the HTTP method handlers you actually implement (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). Do not export unused methods.

---

## 2. Request Validation

Route Handlers do **not** use `safeParse` from Zod — parse the request body directly and return a structured error response on failure:

```ts
import { z } from "zod";
import { NextRequest, NextResponse } from "next/server";

const schema = z.object({
  name: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 },
    );
  }
  // ...
}
```

Never call `req.json()` without a `catch` — malformed bodies will throw.

---

## 3. Authentication

Check the session at the very top of every protected handler — before parsing the body:

```ts
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // ...
}
```

Never trust user IDs from the request body — always derive them from the session.

---

## 4. Response Format

Use `NextResponse.json()` consistently. Return appropriate HTTP status codes:

| Scenario                                    | Status |
| ------------------------------------------- | ------ |
| Success with body                           | `200`  |
| Created resource                            | `201`  |
| Success, no body                            | `204`  |
| Bad input                                   | `400`  |
| Unauthenticated                             | `401`  |
| Forbidden (authenticated but no permission) | `403`  |
| Not found                                   | `404`  |
| Method not allowed                          | `405`  |
| Internal error                              | `500`  |

Never return `200` for errors. Never return raw Prisma models — map to DTOs first.

---

## 5. Rate Limiting

Every unauthenticated or publicly accessible route **must** have rate limiting. Add it immediately after authentication:

```ts
import { rateLimit } from "@/lib/utils/rate-limit"; // <!-- [RATE_LIMIT_HELPER]: add your project's rate limiter here

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = await rateLimit(ip, { max: 10, window: "1m" });
  if (limited) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }
  // ...
}
```

Authenticated routes should also be rate-limited per user ID to prevent abuse.

---

## 6. Webhook Handlers

Webhooks require **signature verification** before processing. Never process a webhook payload without verifying it came from the expected provider:

```ts
export async function POST(req: NextRequest) {
  const rawBody = await req.text(); // must use text(), not json(), for signature verification
  const signature = req.headers.get("stripe-signature") ?? "";

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!,
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }
  // process event...
}
```

- Always use `req.text()` for the raw body — `req.json()` consumes the stream and breaks signature verification.
- Respond quickly (< 5 s) and offload heavy processing to a background job or queue.

---

## 7. Error Handling

All route handlers must catch unexpected errors and return a safe `500` response:

```ts
try {
  // handler logic
} catch (err) {
  logger.error("POST /api/exports failed", { err });
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

Never let a thrown error propagate to the Next.js runtime unhandled — it exposes stack traces.

---

## 8. Edge vs. Node.js Runtime

- Default runtime is **Node.js** — required for Prisma, `crypto`, and most SDKs.
- Only opt into `export const runtime = "edge"` when you explicitly need edge performance and have verified all dependencies support the edge runtime.
- Never use Prisma in edge runtime.

---

## 9. What Does NOT Belong Here

- Business logic → move to `src/lib/actions/` (Server Actions) or `src/lib/utils/`
- Database queries → move to `src/lib/db/`
- Reusable auth checks → move to `src/lib/auth.ts`

Route handlers should be thin: validate → authenticate → delegate → respond.
