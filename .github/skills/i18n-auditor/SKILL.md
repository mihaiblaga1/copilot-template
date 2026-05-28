---
name: i18n-auditor
description: "Scans the codebase or a specific feature for hardcoded user-visible strings, missing translation keys, and i18n anti-patterns. Use when: i18n audit, internationalization, find hardcoded strings, missing translations, localization, l10n, prepare for translation, multilingual."
argument-hint: "Scope to scan. Examples: 'entire codebase', 'alerts feature', 'src/components/billing', 'onboarding flow'"
---

# i18n Auditor

You are a senior engineer specialising in internationalisation (i18n). Your job is to audit a feature or the entire codebase for hardcoded user-visible strings and i18n anti-patterns, then produce a prioritised report that tells the developer exactly what to extract and how.

## Step 0 — Load Project Context

Before auditing, load:

- [project-description.md](../../project-description.md) — domain vocabulary, feature list, and primary users (affects severity: strings in high-traffic flows rank higher)
- [react-best-practices.md](../../instructions/references/react-best-practices.md) — component conventions (to understand where strings are rendered)

Also check whether the project already uses an i18n library by searching for these imports:

- `next-intl`, `react-i18next`, `i18next`, `@lingui/react`, `next-i18next`, `formatjs`

If an i18n library is detected, note which one — the fix suggestions will reference its API. If no library is detected, note that and recommend `next-intl` as the default choice for this Next.js stack.

---

## Step 1 — Identify the Scope

1. If no scope was provided, default to the entire `src/` directory.
2. List every directory and file type you will scan:
   - `src/app/**/*.{tsx,ts}` — pages, layouts, Server Components
   - `src/components/**/*.{tsx,ts}` — all components
   - `src/lib/actions/**/*.ts` — Server Actions (error messages returned to UI)
   - `src/hooks/**/*.ts` — hooks that produce strings (toast messages, labels)
3. Explicitly exclude:
   - `src/components/ui/` — shadcn/ui primitives (not project strings)
   - `*.test.ts`, `*.spec.ts` — test files
   - `node_modules/`, `.github/`
4. Confirm scope with a file count estimate before proceeding.

---

## Step 2 — Scan for Hardcoded Strings

Search for the following patterns in every file in scope. For each match, record a finding.

### Pattern 1 — JSX text content

Literal text between JSX tags that is user-visible:

```tsx
// ❌ Hardcoded
<p>No alerts found. Create one to get started.</p>
<Button>Save changes</Button>
<h1>Dashboard</h1>

// ✅ Extracted
<p>{t("alerts.emptyState.message")}</p>
<Button>{t("common.saveChanges")}</Button>
<h1>{t("dashboard.title")}</h1>
```

**Skip:** single-character strings, punctuation-only, purely numeric, class names, identifiers.

### Pattern 2 — String props (aria-label, placeholder, title, alt)

```tsx
// ❌ Hardcoded
<input placeholder="Search alerts..." aria-label="Search" />
<img alt="User avatar" />

// ✅ Extracted
<input placeholder={t("alerts.search.placeholder")} aria-label={t("alerts.search.label")} />
```

### Pattern 3 — Toast and error messages in actions/hooks

```ts
// ❌ Hardcoded in Server Action
return {
  success: false,
  error: "You have reached the maximum number of alerts.",
};

// ❌ Hardcoded in component
toast.error("Failed to delete alert. Please try again.");

// ✅ Use a translation key, or at minimum a constant
return { success: false, error: t("alerts.errors.limitReached") };
```

### Pattern 4 — Template literals with user-visible content

```tsx
// ❌
const message = `Welcome back, ${user.name}! You have ${count} unread notifications.`;

// ✅ Use i18n pluralisation + interpolation
const message = t("notifications.welcome", { name: user.name, count });
```

### Pattern 5 — Hardcoded locale-sensitive values

- Date/time formatted without `Intl.DateTimeFormat` or a locale-aware library
- Currency amounts formatted without `Intl.NumberFormat`
- Number formatting (thousands separators) without `Intl.NumberFormat`

```ts
// ❌
const formatted = `$${amount.toFixed(2)}`;

// ✅
const formatted = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "USD",
}).format(amount);
```

### Pattern 6 — Missing translation keys (if i18n library already exists)

If a translation library is detected in Step 0, search for `t("...")` calls and cross-reference against the translation file(s) (e.g. `messages/en.json`, `public/locales/en/common.json`). Flag any key used in code but absent from the translation file.

---

## Step 3 — Record Findings

For each instance found, record a finding:

```
FINDING #{n}
Severity: High | Medium | Low
Pattern: JSX text | String prop | Action/toast message | Template literal | Locale formatting | Missing key
File: <relative path>
Line(s): <line numbers>
Hardcoded value: "<the exact string>"
Suggested key: <feature>.<context>.<descriptor>  (e.g. alerts.emptyState.message)
Fix: <concrete extraction with i18n API — code snippet>
```

**Severity guide:**

| Severity | Meaning                                                                                                             |
| -------- | ------------------------------------------------------------------------------------------------------------------- |
| High     | User-facing string in a primary user flow (onboarding, checkout, core CRUD), or an error message returned to the UI |
| Medium   | User-facing string in a secondary flow, or an accessibility label (`aria-label`, `alt`)                             |
| Low      | Tooltip, placeholder, or string in a rarely-visited settings page                                                   |

---

## Step 4 — Compile the Report

Output the following sections:

### 1. i18n Library Status

- Detected library: `<name>` / None detected
- If none: recommendation to add `next-intl` with a one-line install command

### 2. Summary Table

| #   | Severity | Pattern  | File                                   | Hardcoded String   |
| --- | -------- | -------- | -------------------------------------- | ------------------ |
| 1   | High     | JSX text | `components/alerts/empty-state.tsx:14` | "No alerts found." |
| …   | …        | …        | …                                      | …                  |

### 3. Suggested Translation Key Map

Group all suggested keys by feature namespace into a JSON structure the developer can paste into their translation file:

```json
{
  "alerts": {
    "emptyState": {
      "message": "No alerts found.",
      "cta": "Create your first alert"
    },
    "errors": {
      "limitReached": "You have reached the maximum number of alerts."
    }
  }
}
```

### 4. Full Findings

All FINDING blocks from Step 3, sorted High → Low.

### 5. Verdict

- **Total strings to extract:** N
- **High priority:** N | **Medium:** N | **Low:** N
- **Estimated extraction effort:** Small (< 20 strings) / Medium (20–100) / Large (> 100)

---

## Step 5 — Create Linear Tickets

> **Skill:** Load and follow the [linear-ticket-writer](../linear-ticket-writer/SKILL.md) skill for all pre-creation steps, title format, description structure, priority mapping, label strategy, batching rules, and post-creation summary.

Create one ticket per High and Medium finding. Group all Low findings into a single ticket titled `[{FeatureName}] Low-priority i18n cleanup — {n} strings`.

### i18n-specific overrides

- **Source label:** `{featureLabel}-i18n` (e.g. `alerts-i18n`). Create it with color `#0891B2` if it does not exist.
- **Layer:** Always `i18n`.
- **Source line:** `Generated by i18n-auditor on {today's date}`.

Map each FINDING field to the template's description sections:

| FINDING field   | Template section                       |
| --------------- | -------------------------------------- |
| Hardcoded value | **What** ("Extract `{value}` to i18n") |
| Pattern         | **Problem** (explain why it matters)   |
| File / Line(s)  | **Location**                           |
| Severity        | **Impact**                             |
| Fix             | **Suggested Fix**                      |
| Suggested key   | Append to **Suggested Fix**            |
