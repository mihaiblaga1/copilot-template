# React Best Practices

Apply this reference whenever writing or reviewing React components in this project.

---

## 1. Component Design

### 1a. Single Responsibility

Each component should do one thing. If a component fetches data, formats it, and renders complex UI, split it.

**Good:**

```tsx
// DataTable fetches nothing — it only renders
<DataTable rows={rows} columns={columns} />
```

### 1b. Composition over configuration

Prefer composing small primitives over a single mega-component driven by many boolean props.

**Avoid:** `<Modal showHeader showFooter hasCloseButton confirmLabel="Save" />`  
**Prefer:** `<Modal><Modal.Header /><Modal.Body /><Modal.Footer /></Modal>`

---

## 2. State Management

### 2a. Keep state as local as possible

Lift state only as high as the lowest common ancestor that needs it. Avoid storing everything in a global store.

### 2b. Derive, don't duplicate

If a value can be computed from existing state/props, compute it — do not store it in a separate `useState`.

```tsx
// ❌ duplicated state
const [items, setItems] = useState([]);
const [count, setCount] = useState(0); // always equals items.length

// ✅ derived
const count = items.length;
```

### 2c. Initialise state lazily for expensive defaults

```tsx
// ✅ function form avoids re-running on every render
const [state, setState] = useState(() => expensiveComputation());
```

---

## 3. Hooks

### 3a. Custom hooks for reusable logic

Extract stateful logic shared by ≥ 2 components into a `use*` hook in `src/hooks/`.

### 3b. Stable references with `useCallback` / `useMemo`

Wrap callbacks passed to memoised children or listed as `useEffect` deps. Do **not** blindly wrap everything — only where reference equality matters.

### 3c. Prefer `useId` for accessibility IDs

```tsx
const id = useId();
<label htmlFor={id}>Name</label>
<input id={id} />
```

---

## 4. Forms

- Use a form library (e.g. React Hook Form) — do not manage per-field state manually.
- Always pair client-side validation (Zod schema) with the same schema on the Server Action.
- Show field-level error messages, not only a global toast.

---

## 5. Lists & Keys

- Keys must be **stable and unique** — never use array index as a key for lists that can reorder.
- Prefer database IDs or deterministic slugs.

---

## 6. Error Boundaries

- Wrap async Server Component subtrees in an `<ErrorBoundary>` with a user-friendly fallback.
- Do not let an uncaught render error blank the entire page.
