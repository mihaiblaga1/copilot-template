# Page-Level Accessibility Rules

Apply this checklist to every route file (`page.tsx`, `layout.tsx`) and any component that defines page structure, navigation, or modal orchestration.

---

## 1. Page Structure & Landmarks

### 1a. Single `<h1>` per page

**Violation:** A page has zero `<h1>` elements, or more than one.
**WCAG:** 1.3.1 Info and Relationships (Level A)
**Why it matters:** Screen reader users navigate by headings. Multiple `<h1>`s break the document outline; zero `<h1>`s remove the primary entry point.
**Check:** Search the page tree (including Server Component children) for `<h1>`. Layout-level headings count.

### 1b. Heading hierarchy is sequential (no skipped levels)

**Violation:** The heading order jumps (e.g. `<h1>` → `<h3>` with no `<h2>` in between).
**Check:** Map all heading elements in render order and verify no level is skipped.

### 1c. Landmark regions cover all content

**Violation:** Meaningful content exists outside any landmark region (`<main>`, `<nav>`, `<aside>`, `<header>`, `<footer>`).
**Fix:**

```tsx
// Page layout minimum
<header>...</header>
<nav aria-label="Primary navigation">...</nav>
<main>
  <h1>Page Title</h1>
  {children}
</main>
<footer>...</footer>
```

### 1d. Multiple `<nav>` elements are uniquely labelled

**Violation:** The page contains more than one `<nav>` element without distinct `aria-label` values.
**Fix:** `<nav aria-label="Primary">` and `<nav aria-label="Breadcrumb">`.

### 1e. `<main>` is present and wraps primary content

**Violation:** The root layout does not include a `<main>` element, or `<main>` wraps navigation/footer as well.
**Check:** Every route's layout chain should result in exactly one `<main>` per page.

---

## 2. Skip Links

### 2a. Skip-to-main-content link is the first focusable element

**Violation:** The page has no skip link, forcing keyboard users to Tab through the entire navigation on every page load.
**WCAG:** 2.4.1 Bypass Blocks (Level A)
**Fix:**

```tsx
// In root layout, before <header>
<a
  href="#main-content"
  className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring"
>
  Skip to main content
</a>
// ...
<main id="main-content" tabIndex={-1}>
  {children}
</main>
```

### 2b. Skip link target is reachable and focusable

**Violation:** The `#main-content` anchor exists in the DOM but has no `tabIndex={-1}`, so browsers that require it will not focus the target on activation.

---

## 3. Page Title & Language

### 3a. `<html>` element has a `lang` attribute

**Violation:** The root `<html>` does not declare a language.
**WCAG:** 3.1.1 Language of Page (Level A)
**Check:** In Next.js App Router, set `lang` in the root layout:

```tsx
export default function RootLayout({ children }) {
  return <html lang="en">{children}</html>;
}
```

### 3b. Each page has a unique, descriptive `<title>`

**Violation:** Multiple pages share the same `<title>` (e.g. all pages export `title: "App"`), or a page has no title at all.
**WCAG:** 2.4.2 Page Titled (Level A)
**Check:** Every `page.tsx` should export a `metadata` object with a descriptive `title`:

```tsx
export const metadata: Metadata = {
  title: "Alerts | My App",
};
```

Or use the `generateMetadata` function for dynamic titles.

---

## 4. Navigation & Routing

### 4a. Current page indicated in navigation

**Violation:** The active navigation item is visually styled but not marked with `aria-current="page"`.
**WCAG:** 1.3.1 (Level A)
**Fix:**

```tsx
<Link href="/alerts" aria-current={pathname === "/alerts" ? "page" : undefined}>
  Alerts
</Link>
```

### 4b. Breadcrumb landmark is labelled and uses `aria-current`

**Violation:** A breadcrumb `<nav>` lacks `aria-label="Breadcrumb"`, or the current (last) breadcrumb item does not carry `aria-current="page"`.
**Fix:**

```tsx
<nav aria-label="Breadcrumb">
  <ol>
    <li>
      <a href="/">Home</a>
    </li>
    <li>
      <a href="/settings">Settings</a>
    </li>
    <li>
      <a href="/settings/profile" aria-current="page">
        Profile
      </a>
    </li>
  </ol>
</nav>
```

### 4c. Loading states communicated to assistive technology

**Violation:** Next.js `loading.tsx` renders a skeleton with no accessible announcement.
**Best practice:** Add a visually hidden live region to announce loading:

```tsx
// loading.tsx
export default function Loading() {
  return (
    <>
      <span className="sr-only" role="status">
        Loading page content…
      </span>
      <DashboardSkeleton />
    </>
  );
}
```

---

## 5. Modal & Dialog Orchestration

### 5a. Only one `<Dialog>` open at a time (unless intentionally stacked)

**Violation:** Multiple dialogs are open simultaneously without a clear stacking strategy.
**Why it matters:** Stacked modals confuse focus management and screen reader users.

### 5b. Destructive confirm dialogs use `role="alertdialog"`

**Violation:** A confirmation dialog for a destructive action (delete, revoke) uses `role="dialog"` instead of `role="alertdialog"`.
**Why it matters:** `alertdialog` triggers screen readers to announce the dialog immediately and urgently.
**Check:** Radix `<AlertDialog>` sets this automatically — use it for destructive actions.

### 5c. Dialog title is the first content announced

**Violation:** A dialog's title is visually present but not marked as the dialog's accessible name via `aria-labelledby`.
**Check:** Radix `<DialogTitle>` / `<AlertDialogTitle>` handles this automatically. Verify it is not suppressed with `asChild` misuse.

---

## 6. Tables & Data Grids

### 6a. `<table>` used for tabular data, not layout

**Violation:** A `<table>` is used to achieve a visual layout grid rather than to represent relational data.
**WCAG:** 1.3.1 (Level A)

### 6b. Complex tables have `<caption>` or `aria-labelledby`

**Violation:** A data table with more than 3 columns has no caption or label accessible to screen readers.
**Fix:** `<table aria-labelledby="table-title">` or `<caption>Recent Alerts</caption>`.

### 6c. Sortable column headers have `aria-sort`

**Violation:** A column header that toggles sort order does not communicate the current sort state.
**Fix:**

```tsx
<th
  aria-sort={
    sortField === "name"
      ? sortDir === "asc"
        ? "ascending"
        : "descending"
      : "none"
  }
>
  Name
</th>
```

---

## 7. Motion & Animation

### 7a. Animations respect `prefers-reduced-motion`

**Violation:** CSS animations or JS-driven transitions run at full intensity regardless of the user's motion preference.
**WCAG:** 2.3.3 Animation from Interactions (Level AAA — but strongly recommended at AA)
**Check:** Search for Tailwind `animate-*` classes, CSS `@keyframes`, and Framer Motion usage. Each should be gated:

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

In Tailwind, use the `motion-safe:` and `motion-reduce:` variants:

```tsx
<div className="motion-safe:animate-spin motion-reduce:animate-none" />
```

### 7b. Auto-playing content can be paused

**Violation:** A carousel, slideshow, or looping animation starts automatically and has no pause control.
**WCAG:** 2.2.2 Pause, Stop, Hide (Level A)
