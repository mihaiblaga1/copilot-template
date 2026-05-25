# React Performance Anti-patterns

Apply this checklist to every `.tsx` / `.ts` client component file in the feature scope.

---

## 1. `useEffect` Issues

### 1a. Missing dependency (stale closure)

**Pattern:** A value used inside `useEffect` is not listed in the dependency array.
**Detection:** Read the effect body. Any `state`, `prop`, `ref.current` (when accessed reactively), or function defined outside the effect that is read but absent from `[]` is a bug.
**Impact:** High — stale data, bugs that masquerade as performance issues.
**Fix:** Add the missing dep, or wrap the value in `useRef` if it should not re-trigger.

### 1b. Overly broad dependency — causes infinite loop

**Pattern:** An object or array literal is passed directly as a dependency: `useEffect(() => { ... }, [{ id }])`.
**Detection:** Look for object/array literals or functions defined inline inside the deps array.
**Impact:** High — infinite re-render loop, full component subtree re-mounts on every render.
**Fix:** Destructure to primitives (`[id]`) or wrap the value in `useMemo`/`useCallback`.

### 1c. Effect with no cleanup for subscriptions / listeners

**Pattern:** `addEventListener`, `setInterval`, `setTimeout`, WebSocket, or Supabase `subscribe()` inside an effect with no return cleanup function.
**Detection:** Search for these calls inside `useEffect` without a `return () => { ... }` that removes the listener.
**Impact:** High — memory leaks, ghost listeners accumulate across navigation.
**Fix:** Add `return () => { removeEventListener / clearInterval / unsubscribe }`.

### 1d. Data fetch inside `useEffect` without abort

**Pattern:** `fetch()` or a Server Action call inside `useEffect` with no `AbortController`.
**Detection:** Look for `fetch(` or `await someAction(` inside `useEffect` without `AbortController` and `signal`.
**Impact:** Medium — race conditions on rapid re-renders, stale responses applied after component unmounts.
**Fix:** Use `AbortController` + `signal`, or lift the fetch to a server component / `use` hook.

### 1e. Derived state synced via `useEffect`

**Pattern:** A `useEffect` that only sets state based on other state/props — e.g., `useEffect(() => { setFullName(first + ' ' + last) }, [first, last])`.
**Detection:** Effect body contains only a `setState` call computed from deps.
**Impact:** Medium — causes an extra render cycle for every update.
**Fix:** Compute the value inline during render or use `useMemo`.

---

## 2. Missing Memoisation

### 2a. Expensive computation re-runs on every render

**Pattern:** A filter, sort, map, or reduce over a non-trivial array executed directly in render (not wrapped in `useMemo`).
**Detection:** Look for `.filter().sort()`, `.map()`, or `.reduce()` on arrays that come from props or state, running at the top level of a component.
**Impact:** Medium — proportional to array size; compounds with re-renders.
**Fix:** `const result = useMemo(() => data.filter(...).sort(...), [data, ...deps])`.

### 2b. Column definitions recreated on every render (TanStack Table)

**Pattern:** `const columns = [...]` declared at component top level without `useMemo`.
**Detection:** Look for `columnHelper.accessor(...)` or `{ id: '...', cell: ... }` arrays not wrapped in `useMemo`.
**Impact:** High — TanStack Table treats new column reference as a full reset, re-running all virtualization and layout.
**Fix:** `const columns = useMemo(() => [...], [])`.

### 2c. Handler function recreated on every render, passed to child

**Pattern:** `const handleClick = () => { ... }` defined in a component body and passed as a prop to a child component.
**Detection:** Arrow function or `function` declaration at component scope passed as a JSX prop (especially to memoised children).
**Impact:** Medium — breaks `React.memo` on the child, causing unnecessary re-renders.
**Fix:** `const handleClick = useCallback(() => { ... }, [deps])`.

---

## 3. Unnecessary Re-renders

### 3a. Component not memoised but receives stable props

**Pattern:** A "leaf" or "pure display" component that receives only primitive props but is not wrapped in `React.memo`.
**Detection:** Functional component with only primitive/string/number props, exported and used inside a frequently-updating parent.
**Impact:** Low–Medium — may re-render on every parent state change.
**Fix:** `export const MyComponent = React.memo(function MyComponent(...) { ... })`.

### 3b. Context value is a new object on every render

**Pattern:** `<MyContext.Provider value={{ user, setUser }}>` — the object literal is recreated every render.
**Detection:** JSX Provider with an inline object `value={{ ... }}` not wrapped in `useMemo`.
**Impact:** High — every context consumer re-renders on every provider render, even if values haven't changed.
**Fix:** `const value = useMemo(() => ({ user, setUser }), [user])`.

### 3c. Redundant state — computed from other state

**Pattern:** Two pieces of state where one is always derivable from the other (e.g., `filteredItems` derived from `items` + `filter`).
**Detection:** Look for `useState` whose setter is only ever called inside a `useEffect` that depends on other state.
**Impact:** Medium — extra renders, risk of state going out of sync.
**Fix:** Derive the value during render (`const filteredItems = items.filter(...)`), memoised if expensive.

---

## 4. List Rendering

### 4a. Missing or unstable `key` prop

**Pattern:** `.map((item) => <Component />)` without a `key`, or `key={index}` on a list where items can reorder or be deleted.
**Detection:** `.map(` in JSX without `key=` on the returned element, or `key={index}` on dynamic lists.
**Impact:** High — forces full re-mount of list items; DOM thrash on updates.
**Fix:** Use a stable, unique identifier: `key={item.id}`.

### 4b. Large list without virtualization

**Pattern:** Rendering 100+ items with `.map()` with no windowing library.
**Detection:** Look for `data.map(...)` where `data` comes from an API without a `take`/`pageSize` limit AND no virtual list component (`react-window`, `react-virtual`, TanStack Virtual).
**Impact:** High — DOM node count grows linearly; initial paint and scroll become sluggish.
**Fix:** Add server-side pagination OR use `@tanstack/react-virtual` for client-side windowing.

---

## 5. Bundle / Import Size

### 5a. Full library imported instead of named import

**Pattern:** `import _ from 'lodash'` or `import * as Icons from 'lucide-react'`.
**Detection:** Look for default or namespace imports of large packages that support tree-shaking.
**Impact:** Medium — increases JS bundle size, slower initial load.
**Fix:** `import { debounce } from 'lodash-es'` / `import { Search } from 'lucide-react'`.

### 5b. Heavy client-only library imported in a component without dynamic import

**Pattern:** A component that conditionally renders a chart, rich-text editor, or map imports the library at the top level.
**Detection:** Look for large library imports (Recharts, Monaco, Mapbox) in components that are not always rendered.
**Impact:** Medium — adds to the initial JS bundle even if the component is off-screen.
**Fix:** `const Chart = dynamic(() => import('recharts').then(m => m.LineChart), { ssr: false })`.
