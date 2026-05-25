---
applyTo: "**/lib/actions/**"
---

# Server Action Rules (`lib/actions/`)

Apply these rules whenever creating or editing files in this directory.

## File organisation

- One file per **domain** (e.g. `users.ts`, `alerts.ts`, `billing.ts`).
- Export only action functions — no helpers, constants, or types. Those belong in `lib/utils/` or `types/`.
- Mark the file with `"use server"` at the top.

## Return type

Every action must return `ActionResult<T>` — never throw to the client:

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

## Mandatory checklist for every action

1. **Authenticate** — call the session helper first; return `{ success: false, error: "Unauthorized" }` if no session.
2. **Validate** — parse all input with a Zod schema via `safeParse` before touching the database.
3. **Authorise** — scope every query to the authenticated user's ID (or org ID); never trust a client-supplied user ID.
4. **Mutate** — perform the database operation inside a `try/catch`.
5. **Invalidate** — call `revalidatePath` or `revalidateTag` after successful mutations.
6. **Return** — return `{ success: true, data }` or `{ success: false, error: "..." }`.

```ts
"use server";

import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db/client";
import { revalidatePath } from "next/cache";
import type { ActionResult } from "@/types";

const schema = z.object({
  name: z.string().min(1).max(100),
});

export async function createItem(input: unknown): Promise<ActionResult<Item>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };

  const parsed = schema.safeParse(input);
  if (!parsed.success)
    return { success: false, error: parsed.error.issues[0].message };

  try {
    const item = await prisma.item.create({
      data: { ...parsed.data, userId: session.user.id },
    });
    revalidatePath("/dashboard/items");
    return { success: true, data: item };
  } catch (err) {
    logger.error("createItem failed", { err });
    return {
      success: false,
      error: "Failed to create item. Please try again.",
    };
  }
}
```

## Error messages

- Return user-friendly strings — never raw Prisma error messages or stack traces.
- Log with context (action name, sanitised input) using the project logger before returning the error.

## What does NOT belong here

- Data-fetching functions used only by Server Components → put in `lib/db/queries/` or inline in the component.
- Utility/helper functions → put in `lib/utils/`.
- Type definitions → put in `types/`.
