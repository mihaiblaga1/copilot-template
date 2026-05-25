# Next.js App Router Performance Anti-patterns

Apply this checklist to route files (`page.tsx`, `layout.tsx`, `loading.tsx`), server components, and files under `app/`.

---

## 1. Client / Server Component Boundary

### 1a. Client Component that should be a Server Component

**Pattern:** A component marked `"use client"` that contains no event handlers, no state, no browser APIs, and no hooks — it only renders data passed as props or fetched at build time.
**Detection:** `"use client"` at the top; component body has no `useState`, `useEffect`, `useCallback`, `useRef`, `onClick`, `onChange`, or browser globals (`window`, `document`).
**Impact:** High — adds the component and all its imports to the client bundle unnecessarily.
**Fix:** Remove `"use client"` and convert to a Server Component. Move any interactive sub-elements into a separate small `"use client"` leaf component.

### 1b. Heavy third-party library imported in a Client Component without `dynamic`

**Pattern:** A `"use client"` component imports a large library (Recharts, date-fns, etc.) at the top level and that component is rendered conditionally or below the fold.
**Detection:** Top-level `import` of a known large library in a Client Component used in a route that is not always rendered.
**Impact:** Medium — increases the initial JS bundle for all users, even those who never trigger the component.
**Fix:** `const Component = dynamic(() => import('./HeavyComponent'), { ssr: false })`.

---

## 2. Data Fetching Waterfalls

### 2a. Sequential `await` fetches in a Server Component

**Pattern:** Two or more `await` calls to server actions or `fetch()` in a Server Component body where neither depends on the other's result.
**Detection:**

```tsx
// Red flag in a Server Component
const user = await getUser();
const stats = await getStats(); // does not need user
```

**Impact:** High — time-to-first-byte increases by the sum of all latencies instead of the max.
**Fix:** `const [user, stats] = await Promise.all([getUser(), getStats()])`.

### 2b. Data fetched in a layout that blocks all child routes

**Pattern:** `await slowQuery()` inside `layout.tsx` with no `Suspense` boundary wrapping the slow children.
**Detection:** `await` in a `layout.tsx` file (not inside a `Suspense`-wrapped segment).
**Impact:** High — the entire subtree waits for the layout's slowest query before rendering anything.
**Fix:** Move the slow fetch into the specific `page.tsx` that needs it, or wrap the slow part in a `<Suspense fallback={<Skeleton />}>` subtree.

### 2c. Missing `loading.tsx` on a data-heavy route

**Pattern:** A route folder under `app/` that has a `page.tsx` with `await` data fetching but no sibling `loading.tsx`.
**Detection:** `page.tsx` with top-level `await` and no `loading.tsx` in the same directory.
**Impact:** Medium — users see a blank/hung page during data load instead of an immediate skeleton.
**Fix:** Add `loading.tsx` exporting a skeleton that matches the page layout.

---

## 3. Caching & Deduplication

### 3a. Same `fetch` or query called multiple times per request without `React.cache`

**Pattern:** A utility function that queries the database is called in multiple components within the same render tree without being wrapped in `React.cache`.
**Detection:** A `lib/` or `actions/` function called from more than one Server Component in the same route without `cache()`.
**Impact:** Medium — issues duplicate DB/API calls per request even when results are identical.
**Fix:** Wrap in `import { cache } from 'react'; export const getX = cache(async () => { ... })`.

### 3b. `fetch` without cache directive inside a Server Component

**Pattern:** `fetch('https://...')` in a Server Component with no `{ cache: 'force-cache' }` or `{ next: { revalidate: N } }`.
**Detection:** Plain `fetch(url)` or `fetch(url, {})` inside an `async` Server Component.
**Impact:** Low–Medium — defaults to `no-store` in Next.js 15+, meaning a fresh network call on every request.
**Fix:** Add `{ cache: 'force-cache' }` for static data or `{ next: { revalidate: 60 } }` for time-based revalidation.

---

## 4. Static Generation Missed

### 4a. Missing `generateStaticParams` on a dynamic route with known variants

**Pattern:** A `[slug]` or `[id]` route folder where the set of valid values is known and finite (e.g., blog slugs, pricing tiers) but `generateStaticParams` is not exported from `page.tsx`.
**Detection:** Route folder with a `[param]` segment, `page.tsx` with no `export async function generateStaticParams`.
**Impact:** Medium — route is always server-rendered instead of statically generated; adds latency on every visit.
**Fix:** Export `generateStaticParams` returning the list of known params.

---

## 5. Suspense & Streaming

### 5a. No `Suspense` wrapping for async components in a shared layout

**Pattern:** An async Server Component used inside a layout or shared segment without a `Suspense` boundary.
**Detection:** `<AsyncComponent />` in a layout without `<Suspense fallback={...}>` wrapper.
**Impact:** Medium — the entire layout blocks until the async component resolves.
**Fix:** `<Suspense fallback={<Skeleton />}><AsyncComponent /></Suspense>`.

### 5b. `useSearchParams` without `Suspense` boundary

**Pattern:** A Client Component calling `useSearchParams()` not wrapped in a `Suspense` boundary at the page level.
**Detection:** `useSearchParams()` in a `"use client"` component without a parent `<Suspense>`.
**Impact:** High — Next.js will deopts the entire route to client-side rendering (loses SSR), causing a full-page CLS flash.
**Fix:** Wrap the component using `useSearchParams` in `<Suspense fallback={null}>` at the nearest parent.

---

## 6. Server Action Patterns

### 6a. Server Action called in a `useEffect` on mount (client-side fetch on load)

**Pattern:** A Server Action invoked inside `useEffect(() => { fetchData() }, [])` in a Client Component.
**Detection:** Server Action import used inside `useEffect` with empty deps `[]`.
**Impact:** Medium — adds a client-to-server round-trip after hydration. Data arrives later than if fetched in a Server Component.
**Fix:** Lift the data fetch to the nearest Server Component ancestor and pass the result as a prop.

### 6b. Server Action re-invoked on every render without guards

**Pattern:** A Server Action call that is not inside a `useCallback` or guarded by a loading flag, making it possible to fire multiple times.
**Detection:** Server Action call (via `useServerAction` hook's `call(...)`) inside an event handler that is itself recreated on every render.
**Impact:** Medium — race conditions, duplicate mutations.
**Fix:** Ensure the handler is wrapped in `useCallback` and the `loading` flag from `useServerAction` prevents re-invocation while in-flight.
