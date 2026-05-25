# API Route Best Practices

Apply this reference whenever writing or reviewing Next.js Route Handlers in `src/app/api/`.

---

## 1. Response Helpers

Always use `NextResponse.json()` — never construct raw `Response` objects unless streaming.

### Standard success response

```ts
return NextResponse.json({ data }, { status: 200 });
```

### Standard error response

```ts
return NextResponse.json({ error: "Human-readable message" }, { status: 400 });
```

### No-body response (e.g. DELETE success)

```ts
return new NextResponse(null, { status: 204 });
```

### Consistent error shape

Every error response must follow the same shape so clients can handle them uniformly:

```ts
type ApiError = { error: string; code?: string };
```

Never include stack traces, Prisma error details, or internal IDs in error responses.

---

## 2. Streaming Responses

Use the Web Streams API for streaming (e.g. AI text generation, large file exports):

```ts
export async function GET(req: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of generateChunks()) {
        controller.enqueue(new TextEncoder().encode(chunk));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
```

- Set `export const dynamic = "force-dynamic"` on streaming routes.
- Do not use `NextResponse.json()` for streams — it buffers the full response.
- Always handle client disconnects to avoid leaked resources:
  ```ts
  req.signal.addEventListener("abort", () => controller.close());
  ```

---

## 3. Authentication Patterns

### Session-based (standard)

```ts
const session = await auth();
if (!session?.user) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### API key authentication (for machine-to-machine routes)

```ts
const apiKey = req.headers.get("x-api-key");
if (!apiKey || !(await verifyApiKey(apiKey))) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
```

### Webhook signature verification

Always verify before reading the payload. See [security-best-practices.md](./security-best-practices.md) for the full pattern.

---

## 4. Rate Limiting

### Token bucket per IP (unauthenticated routes)

```ts
const ip =
  req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
const { success } = await rateLimit.check(ip, { requests: 20, window: "1m" });
if (!success) {
  return NextResponse.json({ error: "Too many requests" }, { status: 429 });
}
```

### Per-user rate limiting (authenticated routes)

```ts
const { success } = await rateLimit.check(`user:${session.user.id}`, {
  requests: 100,
  window: "1m",
});
```

### Response headers

Include rate limit headers so clients can back off gracefully:

```ts
return NextResponse.json(data, {
  headers: {
    "X-RateLimit-Limit": "100",
    "X-RateLimit-Remaining": remaining.toString(),
    "X-RateLimit-Reset": resetAt.toISOString(),
  },
});
```

---

## 5. Error Format & Handling

Every handler must be wrapped in a try/catch:

```ts
export async function POST(req: NextRequest) {
  try {
    // handler logic
  } catch (err) {
    logger.error("POST /api/resource failed", { err, url: req.url });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
```

### Status code guide

| Scenario                                  | Code |
| ----------------------------------------- | ---- |
| Valid request, response body              | 200  |
| Resource created                          | 201  |
| Success, no body                          | 204  |
| Malformed request / validation failure    | 400  |
| Missing or invalid auth                   | 401  |
| Authenticated but insufficient permission | 403  |
| Resource not found                        | 404  |
| Wrong HTTP method                         | 405  |
| Rate limit exceeded                       | 429  |
| Unexpected server error                   | 500  |

---

## 6. Caching

- Route Handlers are **not cached by default** in Next.js App Router (unlike `fetch` in Server Components).
- To opt into caching for GET handlers:
  ```ts
  export const revalidate = 60; // seconds
  ```
- For fully dynamic routes: `export const dynamic = "force-dynamic"`.
- Never cache handlers that check authentication — cached responses bypass auth.

---

## 7. Thin Handler Principle

Route handlers must be thin. Move everything except HTTP concerns into dedicated layers:

```
Handler responsibility     → validate input, check auth, call service, format response
Service/action layer       → src/lib/actions/ or src/lib/services/
Database layer             → src/lib/db/
```

If a handler exceeds ~60 lines, extract the business logic.
