---
name: "Scaffold Feature"
description: "Given a feature name, scaffolds the full file tree for a new dashboard feature: route folder, Server Action, TypeScript types, skeleton component, and empty state — following the project structure from copilot-instructions.md."
agent: "agent"
tools: [read, edit, search, todo]
---

# Scaffold Feature

You are scaffolding a brand-new feature for this Next.js App Router project. Your job is to create the correct file tree, stub out each file with the right structure, and leave clear `// TODO` markers for the developer to fill in. You do **not** implement business logic — you set up the skeleton so the developer can start immediately in the right place.

## Target Feature

The feature to scaffold is: **${input:featureName}**

If no name was provided, ask before proceeding.

---

## Step 0 — Load Project Conventions

Before creating any files, load the project's standards:

- [project-description.md](../project-description.md) — domain vocabulary and feature areas (use correct domain terminology in names and comments)
- [copilot-instructions.md](../copilot-instructions.md) — project structure, mandatory patterns
- [project-patterns.md](../instructions/references/project-patterns.md) — project-specific overrides
- [server-actions-best-practices.md](../instructions/references/server-actions-best-practices.md) — Action file structure
- [react-best-practices.md](../instructions/references/react-best-practices.md) — component conventions

Also search the codebase for 1–2 existing features in `src/app/(dashboard)/` to use as style references before scaffolding. Match their import paths, naming conventions, and file organisation exactly.

---

## Step 1 — Derive Names & Paths

From the feature name, derive the following identifiers. Show them to the user before creating any files:

| Identifier         | Derivation rule              | Example (feature: "Alert Rules") |
| ------------------ | ---------------------------- | -------------------------------- |
| `routeSegment`     | kebab-case                   | `alert-rules`                    |
| `ActionName`       | PascalCase + "Action" suffix | `AlertRulesAction`               |
| `entityName`       | singular PascalCase          | `AlertRule`                      |
| `entityNamePlural` | plural PascalCase            | `AlertRules`                     |
| `componentPrefix`  | PascalCase                   | `AlertRules`                     |
| `actionFile`       | kebab-case                   | `alert-rules.ts`                 |
| `typesFile`        | kebab-case                   | `alert-rules.ts`                 |

Confirm with the user if any derivation looks wrong before proceeding.

---

## Step 2 — Create the File Tree

Create every file listed below. Use the stubs in Step 3.

```
src/
├── app/
│   └── (dashboard)/
│       └── {routeSegment}/
│           ├── page.tsx                          ← async Server Component, data fetch
│           ├── loading.tsx                       ← skeleton fallback
│           └── _components/
│               ├── {componentPrefix}List.tsx     ← Client Component, renders list
│               └── {componentPrefix}Card.tsx     ← single item card
├── lib/
│   └── actions/
│       └── {actionFile}                          ← Server Actions file
└── types/
    └── {typesFile}                               ← DTO types + Zod schemas
```

> **Note:** `_components/` with the leading underscore is a Next.js convention to co-locate components with a route without making them routable.

If the project structure uses a different layout (e.g. `src/components/[feature]/` for shared components), match what you found in Step 0.

---

## Step 3 — File Stubs

### `src/types/{typesFile}`

```ts
import { z } from 'zod';

// -----------------------------------------------------------------------
// Zod schemas — used for validation in Server Actions
// -----------------------------------------------------------------------

export const Create{entityName}Schema = z.object({
  // TODO: add fields
});

export const Update{entityName}Schema = Create{entityName}Schema.partial().extend({
  id: z.string().cuid(),
});

export type Create{entityName}Input = z.infer<typeof Create{entityName}Schema>;
export type Update{entityName}Input = z.infer<typeof Update{entityName}Schema>;

// -----------------------------------------------------------------------
// DTO — safe shape returned to the client (no raw Prisma model)
// -----------------------------------------------------------------------

export type {entityName}DTO = {
  id: string;
  // TODO: add fields
  createdAt: Date;
  updatedAt: Date;
};
```

---

### `src/lib/actions/{actionFile}`

```ts
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';

import { db } from '@/lib/db';
import { getSession } from '@/lib/auth'; // TODO: replace with your auth helper
import {
  Create{entityName}Schema,
  Update{entityName}Schema,
  type {entityName}DTO,
} from '@/types/{typesFile without extension}';

type ActionResult<T> = { success: true; data: T } | { success: false; error: string };

// -----------------------------------------------------------------------
// get{entityNamePlural} — used by the Server Component page
// -----------------------------------------------------------------------
export async function get{entityNamePlural}(): Promise<ActionResult<{entityName}DTO[]>> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorised' };

    const items = await db.{entityName in camelCase}.findMany({
      where: {
        // TODO: scope to current user / org
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      // TODO: add pagination
    });

    // Map to DTO — never return raw Prisma models
    const data: {entityName}DTO[] = items.map((item) => ({
      id: item.id,
      // TODO: map remaining fields
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return { success: true, data };
  } catch (err) {
    console.error('get{entityNamePlural}:', err);
    return { success: false, error: 'Failed to load {entityNamePlural lower}.' };
  }
}

// -----------------------------------------------------------------------
// create{entityName}
// -----------------------------------------------------------------------
export async function create{entityName}(
  input: unknown,
): Promise<ActionResult<{entityName}DTO>> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorised' };

    const parsed = Create{entityName}Schema.safeParse(input);
    if (!parsed.success) {
      return { success: false, error: parsed.error.errors[0]?.message ?? 'Invalid input.' };
    }

    const item = await db.{entityName in camelCase}.create({
      data: {
        ...parsed.data,
        // TODO: attach userId / orgId
      },
    });

    revalidatePath('/{routeSegment}');

    return {
      success: true,
      data: {
        id: item.id,
        // TODO: map remaining fields
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
    };
  } catch (err) {
    console.error('create{entityName}:', err);
    return { success: false, error: 'Failed to create {entityName lower}.' };
  }
}

// -----------------------------------------------------------------------
// delete{entityName} — soft delete
// -----------------------------------------------------------------------
export async function delete{entityName}(id: string): Promise<ActionResult<void>> {
  try {
    const session = await getSession();
    if (!session?.user) return { success: false, error: 'Unauthorised' };

    // TODO: verify ownership before mutating
    await db.{entityName in camelCase}.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    revalidatePath('/{routeSegment}');
    return { success: true, data: undefined };
  } catch (err) {
    console.error('delete{entityName}:', err);
    return { success: false, error: 'Failed to delete {entityName lower}.' };
  }
}
```

---

### `src/app/(dashboard)/{routeSegment}/page.tsx`

```tsx
import { Suspense } from 'react';

import { get{entityNamePlural} } from '@/lib/actions/{actionFile without extension}';
import { {componentPrefix}List } from './_components/{componentPrefix}List';
import { {componentPrefix}ListSkeleton } from './loading';

export const metadata = {
  title: '{entityNamePlural} | App', // TODO: update app name
};

export default async function {componentPrefix}Page() {
  const result = await get{entityNamePlural}();

  if (!result.success) {
    // TODO: render a proper error boundary or redirect
    throw new Error(result.error);
  }

  return (
    <main className="container py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">{entityNamePlural}</h1>
        {/* TODO: add Create button / dialog trigger */}
      </div>

      <Suspense fallback={<{componentPrefix}ListSkeleton />}>
        <{componentPrefix}List items={result.data} />
      </Suspense>
    </main>
  );
}
```

---

### `src/app/(dashboard)/{routeSegment}/loading.tsx`

```tsx
import { Skeleton } from '@/components/ui/skeleton';

export function {componentPrefix}ListSkeleton() {
  return (
    <div className="mt-6 space-y-3" role="status" aria-label="Loading {entityNamePlural lower}…">
      {Array.from({ length: 5 }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-lg" />
      ))}
    </div>
  );
}

export default function Loading() {
  return <{componentPrefix}ListSkeleton />;
}
```

---

### `src/app/(dashboard)/{routeSegment}/_components/{componentPrefix}List.tsx`

```tsx
'use client';

import { type {entityName}DTO } from '@/types/{typesFile without extension}';
import { {componentPrefix}Card } from './{componentPrefix}Card';

// TODO: import EmptyState from your shared components
// import { EmptyState } from '@/components/empty-state';

interface {componentPrefix}ListProps {
  items: {entityName}DTO[];
}

export function {componentPrefix}List({ items }: {componentPrefix}ListProps) {
  if (items.length === 0) {
    return (
      // TODO: replace with <EmptyState /> component
      <div className="mt-6 flex flex-col items-center gap-4 py-16 text-center text-muted-foreground">
        <p className="text-sm">No {entityNamePlural lower} yet.</p>
        {/* TODO: add a Call-to-Action button here */}
      </div>
    );
  }

  return (
    <ul className="mt-6 space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <{componentPrefix}Card item={item} />
        </li>
      ))}
    </ul>
  );
}
```

---

### `src/app/(dashboard)/{routeSegment}/_components/{componentPrefix}Card.tsx`

```tsx
'use client';

import { useServerAction } from '@/hooks/use-server-action';
import { delete{entityName} } from '@/lib/actions/{actionFile without extension}';
import { type {entityName}DTO } from '@/types/{typesFile without extension}';
import { toast } from 'sonner';
// import { ConfirmDialog } from '@/components/confirm-dialog'; // TODO: use ConfirmDialog for delete

interface {componentPrefix}CardProps {
  item: {entityName}DTO;
}

export function {componentPrefix}Card({ item }: {componentPrefix}CardProps) {
  const { execute: handleDelete, isPending } = useServerAction(delete{entityName}, {
    onSuccess: () => toast.success('{entityName} Deleted'),
    onError: (err) => toast.error(err),
  });

  return (
    <div className="flex items-center justify-between rounded-lg border bg-card px-4 py-3">
      {/* TODO: render item fields */}
      <p className="text-sm font-medium">{item.id}</p>

      {/* TODO: wrap with <ConfirmDialog> for destructive actions */}
      <button
        type="button"
        onClick={() => handleDelete(item.id)}
        disabled={isPending}
        aria-label={`Delete ${item.id}`}
        className="text-sm text-destructive hover:underline disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-ring"
      >
        {isPending ? 'Deleting…' : 'Delete'}
      </button>
    </div>
  );
}
```

---

## Step 4 — Post-Scaffold Checklist

After creating all files, output this checklist so the developer knows exactly what to do next:

```markdown
## Scaffold complete — next steps

### Required

- [ ] Add `{entityName}` model to `prisma/schema.prisma` and run `prisma migrate dev`
- [ ] Replace `getSession()` import with the project's actual auth helper
- [ ] Fill in the `// TODO: add fields` sections in `src/types/{typesFile}`
- [ ] Map Prisma model fields to DTO in `get{entityNamePlural}` and `create{entityName}`
- [ ] Scope DB queries to the current user / org (ownership check)
- [ ] Add the route to the sidebar / navigation

### Recommended

- [ ] Add a Create{entityName}Dialog component triggered from the page header
- [ ] Wrap the Delete button in `<ConfirmDialog>` with a consequence description
- [ ] Add pagination to `get{entityNamePlural}` (cursor or offset)
- [ ] Write unit tests for the Server Actions (`npm run test`)
- [ ] Run the accessibility auditor on the new route
```

> Run the `unit-test-writer` skill on `src/lib/actions/{actionFile}` when ready to add tests.

```

```
