# Next.js App Router Best Practices

Apply this reference whenever writing or reviewing Next.js routing, layouts, and rendering in this project.

---

## 1. Server vs. Client Components

### 1a. Default to Server Components

Every component is a Server Component by default. Add `"use client"` only when you need:

- `useState` / `useReducer` / `useContext`
- Browser-only APIs (`window`, `document`, `navigator`)
- Event listeners (`onClick`, `onChange`, etc.)
- Third-party libraries that rely on the above

### 1b. Push `"use client"` to the leaves

Keep the interactive shell as small as possible. Fetch and render static structure on the server; hand off only the interactive slice to the client.

```
Page (Server) → Layout (Server) → StaticContent (Server) → InteractiveWidget (Client ← boundary here)
```

### 1c. Do not import Server-only code in Client Components

Use the `server-only` package to hard-fail at build time if a server module is accidentally imported client-side.

```ts
// src/lib/db/client.ts
import "server-only";
```

---

## 2. Routing & Layouts

### 2a. Co-locate route-specific components

Place components used by a single route inside that route's folder, not in the global `components/` directory.

```
app/(dashboard)/alerts/
├── page.tsx
├── alerts-table.tsx      ← route-specific
└── alert-row-actions.tsx ← route-specific
```

### 2b. Use route groups for layout sharing

Use `(groupName)` folders to share layouts without affecting the URL segment.

### 2c. Parallel & intercepting routes for modals

Use parallel routes (`@modal`) for sheet/dialog patterns that need their own URL rather than adding modal state to query params.

---

## 3. Data Fetching

### 3a. Fetch as close to the consumer as possible

Avoid a single top-level fetch that passes data through many component layers. Each Server Component can fetch its own slice.

### 3b. Use `cache()` for shared data within a request

```ts
import { cache } from "react";
export const getUser = cache(async (id: string) =>
  prisma.user.findUnique({ where: { id } }),
);
```

### 3c. Streaming with Suspense

Wrap slow data-fetching Server Components in `<Suspense>` to unblock the rest of the page.

```tsx
<Suspense fallback={<StatsSkeleton />}>
  <StatsPanel /> {/* async Server Component */}
</Suspense>
```

### 3d. `generateStaticParams` for static routes

For routes with a finite set of known params, export `generateStaticParams` to pre-render at build time.

---

## 4. Metadata & SEO

- Export a `metadata` object or `generateMetadata` function from every `page.tsx`.
- Never set `<title>` or `<meta>` tags manually inside components — use the Metadata API.

---

## 5. Images & Assets

- Always use `next/image` for images — never bare `<img>` tags.
- Set `width` and `height` (or `fill` + a sized container) to avoid layout shift.
- Use `priority` only for above-the-fold images (LCP candidate).

---

## 6. Middleware

- Keep middleware lean — it runs on every matched request on the edge.
- Do not perform database queries in middleware; use lightweight session/cookie checks only.
- Define a tight `matcher` to avoid running middleware on static assets.
