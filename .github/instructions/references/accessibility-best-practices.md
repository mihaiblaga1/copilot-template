# Accessibility Best Practices (WCAG 2.1 AA)

Apply this reference when building or reviewing UI components, pages, and interactive elements. Target: WCAG 2.1 Level AA compliance.

---

## 1. Semantic HTML First

Use the correct HTML element before reaching for ARIA. ARIA only patches missing semantics — it cannot fix the wrong element.

| Use                      | Instead of                               |
| ------------------------ | ---------------------------------------- |
| `<button>`               | `<div onClick>` or `<span onClick>`      |
| `<a href>`               | `<div onClick>` for navigation           |
| `<nav>`                  | `<div className="nav">`                  |
| `<main>`                 | `<div id="main">`                        |
| `<header>`, `<footer>`   | generic `<div>` wrappers                 |
| `<ul>` / `<ol>` + `<li>` | `<div>` lists                            |
| `<table>`                | CSS grid faking a table for tabular data |

---

## 2. Keyboard Navigation

Every interactive element must be reachable and operable by keyboard alone:

- **Tab order** must follow visual reading order. Never use `tabIndex > 0` — it breaks the natural order.
- **Focus must be visible.** Never `outline: none` without providing an equally visible custom focus ring:
  ```css
  :focus-visible {
    outline: 2px solid hsl(var(--ring));
    outline-offset: 2px;
  }
  ```
- **Modals and dialogs** must trap focus inside while open and restore focus to the trigger on close. Radix UI Dialog handles this — do not reimplement it manually.
- **Dropdown menus** must close on `Escape` and support arrow-key navigation. Radix UI DropdownMenu handles this.
- **Custom keyboard shortcuts** must not conflict with browser or screen reader shortcuts.

---

## 3. ARIA Patterns for shadcn/ui Components

shadcn/ui wraps Radix primitives which handle most ARIA automatically. Rules:

### Labels on icon-only buttons

```tsx
// ❌ No accessible name
<Button size="icon"><Trash2 /></Button>

// ✅ aria-label
<Button size="icon" aria-label="Delete item"><Trash2 /></Button>
```

### Form fields

```tsx
// ❌ Floating label only — fails without visible association
<Input placeholder="Email" />

// ✅ Paired label
<Label htmlFor="email">Email</Label>
<Input id="email" type="email" />
```

### Error messages

```tsx
// ✅ Associate error with field via aria-describedby
<Input id="email" aria-describedby="email-error" aria-invalid={!!error} />;
{
  error && (
    <p id="email-error" role="alert">
      {error}
    </p>
  );
}
```

### Loading states

```tsx
// ✅ Announce loading to screen readers
<Button disabled aria-busy="true">
  <Loader2 className="animate-spin" aria-hidden="true" />
  Saving...
</Button>
```

### Decorative icons

```tsx
// ✅ Hide decorative icons from screen readers
<CheckCircle aria-hidden="true" />
```

---

## 4. Color & Contrast

- **Text contrast ratio:** ≥ 4.5:1 for normal text, ≥ 3:1 for large text (18pt+ or 14pt+ bold).
- **UI component contrast:** ≥ 3:1 for interactive element boundaries against their background.
- **Never convey information through color alone.** Pair color with an icon, label, or pattern.
  - ❌ Red border = error (color only)
  - ✅ Red border + error icon + error message text
- Reference colors via CSS variables (`text-destructive`, `text-muted-foreground`) — never hardcode hex values that bypass the contrast check.

---

## 5. Images & Media

```tsx
// ✅ Informative image — describe the content
<Image src={chart} alt="Monthly revenue increased 23% in Q2" />

// ✅ Decorative image — empty alt hides from screen reader
<Image src={divider} alt="" />

// ❌ Never omit alt entirely
<Image src={logo} /> // missing alt is a violation
```

- Videos must have captions for spoken content (WCAG 1.2.2).
- Audio-only content must have a text transcript.

---

## 6. Page Structure

Every page must have:

```tsx
// ✅ One <h1> per page matching the page title
<h1>Dashboard</h1>

// ✅ Logical heading hierarchy (h1 → h2 → h3, never skip levels)

// ✅ Skip-to-content link as the first focusable element
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>
<main id="main-content">...</main>

// ✅ Page <title> set via Next.js Metadata API
export const metadata = { title: "Dashboard | App Name" };
```

---

## 7. Motion & Animation

Respect the user's motion preference:

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

- Do not auto-play animations that last more than 5 seconds without a pause control.
- Flashing content more than 3 times per second can trigger seizures — avoid it entirely.

---

## 8. Testing Checklist

Before marking a component or page complete, verify:

- [ ] All interactive elements reachable by keyboard (`Tab`, `Enter`, `Space`, `Escape`, arrow keys)
- [ ] Focus ring visible on all interactive elements in `:focus-visible` state
- [ ] All images have meaningful `alt` text or `alt=""`
- [ ] All form inputs have associated `<label>` elements
- [ ] Error messages are associated via `aria-describedby` and announced via `role="alert"`
- [ ] Color is not the sole differentiator for any information
- [ ] Page has one `<h1>`, logical heading hierarchy, and a `<main>` landmark
- [ ] `aria-label` on all icon-only buttons
- [ ] Decorative icons have `aria-hidden="true"`
