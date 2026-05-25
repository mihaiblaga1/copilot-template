# Component-Level Accessibility Rules

Apply this checklist to every `.tsx` component file in the feature scope.

---

## 1. Semantic HTML

### 1a. Interactive elements use the correct native element

**Violation:** A non-interactive element (`<div>`, `<span>`) is used as a button, link, or control without a matching ARIA role.
**Why it matters:** Screen readers announce elements by their role. A `<div onClick>` is announced as nothing — users cannot discover or activate it.
**Check:** Any element with an `onClick` handler must be `<button>`, `<a href>`, or a native input — or carry `role="button"` with `tabIndex={0}` and keyboard handlers.
**Fix:**

```tsx
// ❌ wrong
<div onClick={handleDelete} className="cursor-pointer">Delete</div>

// ✅ correct
<button onClick={handleDelete} type="button">Delete</button>
```

### 1b. Decorative icons are hidden from assistive technology

**Violation:** A purely decorative `<svg>` or `<img>` is exposed to screen readers.
**Check:** Icon-only decorative elements must have `aria-hidden="true"`. Lucide icons accept `aria-hidden`.
**Fix:**

```tsx
// ❌ wrong
<AlertCircle className="text-red-500" />

// ✅ correct
<AlertCircle className="text-red-500" aria-hidden="true" />
```

### 1c. Icon-only buttons have an accessible name

**Violation:** A `<button>` contains only an icon with no visible text and no `aria-label`.
**WCAG:** 4.1.2 Name, Role, Value (Level A)
**Fix:**

```tsx
// ❌ wrong
<button onClick={onClose}><X /></button>

// ✅ correct
<button onClick={onClose} aria-label="Close dialog"><X aria-hidden="true" /></button>
```

### 1d. Lists use `<ul>`/`<ol>` + `<li>`, not `<div>` wrappers

**Violation:** A rendered list of items uses `<div>` containers instead of semantic list elements.
**Check:** Any `.map()` rendering multiple sibling items of the same type should use `<ul>` + `<li>`.

---

## 2. Keyboard Navigation

### 2a. All interactive elements are reachable via Tab

**Violation:** A custom interactive control has `tabIndex={-1}` or no `tabIndex` when it should be focusable.
**Check:** Every control a mouse user can click must also be reachable by keyboard tab order.

### 2b. No positive `tabIndex` values

**Violation:** `tabIndex={1}` or any positive integer is used.
**Why it matters:** Positive `tabIndex` values override the natural document order and create an unpredictable, confusing tab sequence.
**Fix:** Remove the positive value. Reorder DOM elements instead.

### 2c. Modals and dialogs trap focus

**Violation:** A modal/dialog/drawer does not trap focus — Tab exits the overlay and moves to content behind it.
**WCAG:** 2.1.2 No Keyboard Trap (Level A) — the inverse: users must be able to move focus INTO the trap, and Escape must release it.
**Check:** Dialogs built on Radix UI's `<Dialog>` primitive handle this automatically. Custom overlays must implement a focus trap manually.
**Fix:** Use Radix `<Dialog>` or `<AlertDialog>`. If custom, use the `focus-trap-react` library or an equivalent.

### 2d. Escape closes overlay components

**Violation:** A modal, dropdown, tooltip, or popover cannot be dismissed with the Escape key.
**Check:** Radix UI primitives handle Escape automatically. Verify custom overlays.

### 2e. Keyboard handlers accompany mouse handlers on non-native elements

**Violation:** A `<div role="button">` has `onClick` but no `onKeyDown` to handle Enter and Space.
**Fix:**

```tsx
<div
  role="button"
  tabIndex={0}
  onClick={handleAction}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') handleAction(); }}
>
```

### 2f. Focus returns to trigger after overlay closes

**Violation:** After closing a modal or dropdown, focus is lost (moves to `<body>`) instead of returning to the element that opened it.
**Check:** Radix handles this. Verify custom implementations store a `triggerRef` and call `.focus()` on close.

---

## 3. ARIA Attributes

### 3a. `aria-label` / `aria-labelledby` present on all landmark regions and dialogs

**Violation:** A `<section>`, `<nav>`, `<aside>`, `<dialog>`, or `role="dialog"` has no accessible name.
**WCAG:** 1.3.1 Info and Relationships (Level A)
**Fix:**

```tsx
// ✅ labelled section
<section aria-labelledby="recent-alerts-heading">
  <h2 id="recent-alerts-heading">Recent Alerts</h2>
  ...
</section>
```

### 3b. Form validation errors linked to their input

**Violation:** An error message appears next to an input but is not programmatically associated with it.
**WCAG:** 1.3.1 (Level A), 3.3.1 Error Identification (Level A)
**Fix:**

```tsx
<Input
  id="email"
  aria-describedby={error ? "email-error" : undefined}
  aria-invalid={!!error}
/>;
{
  error && (
    <p id="email-error" role="alert">
      {error}
    </p>
  );
}
```

### 3c. Loading states announced to screen readers

**Violation:** A loading spinner is shown visually but not communicated to screen reader users.
**Fix:**

```tsx
<div role="status" aria-live="polite" aria-label="Loading…">
  <Spinner aria-hidden="true" />
</div>
```

### 3d. `aria-expanded` on toggle controls

**Violation:** An accordion header, collapsible section button, or "show more" control does not reflect its open/closed state.
**Fix:** `<button aria-expanded={isOpen}>` — Radix primitives handle this automatically.

### 3e. `aria-current` on active navigation items

**Violation:** The current page or active step in a stepper is not indicated programmatically.
**Fix:** `<a aria-current="page" href="/alerts">Alerts</a>`

### 3f. No redundant ARIA (`role="button"` on `<button>`)

**Violation:** Redundant roles add noise and can confuse some assistive technologies.
**Check:** `<button role="button">` and `<a role="link">` are redundant — remove the role attribute.

---

## 4. Colour & Visual

### 4a. Text contrast meets WCAG AA minimum

**Violation:** Text on a background does not meet 4.5:1 contrast ratio (3:1 for large text ≥ 18pt / 14pt bold).
**WCAG:** 1.4.3 Contrast (Minimum) (Level AA)
**Check:** Look for hardcoded low-contrast colour pairs (e.g. `text-gray-400` on `bg-white`). Reference `globals.css` CSS variables — if they are correctly defined there, this is a design-token issue, not a component issue.

### 4b. Focus indicator visible on all interactive elements

**Violation:** The browser's default `:focus` outline is suppressed with `outline: none` or `outline: 0` without a replacement `:focus-visible` ring.
**Check:** Search for `outline-none` in Tailwind classes. Acceptable only when replaced with a custom ring, e.g. `focus-visible:ring-2 focus-visible:ring-ring`.
**Fix:**

```tsx
// ❌ removes focus indicator entirely
<button className="outline-none">

// ✅ replaces with Tailwind ring
<button className="outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
```

### 4c. Information not conveyed by colour alone

**Violation:** Status (error, success, warning) is shown only through colour (e.g. a red border) with no icon or text label.
**WCAG:** 1.4.1 Use of Colour (Level A)
**Fix:** Pair colour with an icon and/or text: `<AlertCircle aria-hidden="true" /> Error: email is invalid`.

---

## 5. Forms & Validation

### 5a. Every input has an associated `<label>`

**Violation:** An `<Input>` or `<Select>` has no `<label>` element associated via `htmlFor` / `id`, and no `aria-label` or `aria-labelledby`.
**WCAG:** 1.3.1 (Level A), 3.3.2 Labels or Instructions (Level A)
**Fix:**

```tsx
<label htmlFor="name">Full name</label>
<Input id="name" name="name" />
```

### 5b. Required fields indicated accessibly

**Violation:** Required fields are shown with a visual `*` only, not communicated to screen readers.
**Fix:** `<Input required aria-required="true" />` and label the asterisk: `<span aria-hidden="true">*</span><span className="sr-only">(required)</span>`.

### 5c. Error summary for multi-field forms

**Violation:** A long form with multiple validation errors shows errors only next to each field, with no summary at the top.
**Best practice:** After failed submission, move focus to a summary: `<div role="alert" tabIndex={-1}>Please fix N errors before continuing.</div>` and call `.focus()` on it.

### 5d. Autocomplete attributes on personal data fields

**Violation:** Name, email, address, or phone inputs do not carry `autoComplete` attributes.
**WCAG:** 1.3.5 Identify Input Purpose (Level AA)
**Fix:** `<Input autoComplete="email" />`, `<Input autoComplete="given-name" />`, etc.

---

## 6. Dynamic Content & Live Regions

### 6a. Success/error toasts announced to screen readers

**Violation:** Sonner toasts appear visually but the toast container lacks `aria-live`.
**Check:** Sonner's `<Toaster />` component renders with `aria-live="polite"` by default — verify it is not overridden.

### 6b. Route-change focus management

**Violation:** After a client-side navigation (Next.js `router.push`), focus stays on the element that triggered navigation instead of moving to a meaningful target.
**Best practice:** After navigation, focus the `<h1>` of the new page or a skip-link target.

### 6c. Data tables have headers associated with cells

**Violation:** A `<table>` uses `<td>` for header cells or does not use `scope` on `<th>` elements.
**Fix:**

```tsx
<th scope="col">Name</th>   // column header
<th scope="row">Row 1</th>  // row header
```
