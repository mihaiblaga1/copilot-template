# Server Actions Best Practices

Apply this reference whenever writing or reviewing Server Actions in `src/lib/actions/`.

---

## 1. Structure & Typing

### 1a. Always return `ActionResult<T>`

Never throw errors to the client. Every action returns a discriminated union:

```ts
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };
```

### 1b. One file per domain

Group related actions in a single file named after the domain:

- `src/lib/actions/users.ts`
- `src/lib/actions/alerts.ts`
- `src/lib/actions/billing.ts`

### 1c. Export only action functions

Do not export helpers, constants, or types from action files — those belong in `src/lib/utils/` or `src/types/`.

---

## 2. Validation

### 2a. Validate with Zod at the action boundary

Every public-facing action must parse its input before any database access:

```ts
const schema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

export async function createUser(input: unknown): Promise<ActionResult<User>> {
  const parsed = schema.safeParse(input);
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message };
  }
  // proceed with parsed.data
}
```

### 2b. Reuse schemas between actions and forms

Export the Zod schema from the action file and import it into the client-side form for consistent validation.

---

## 3. Authentication

### 3a. Check session at the top of every protected action

```ts
export async function updateProfile(
  input: unknown,
): Promise<ActionResult<Profile>> {
  const session = await auth();
  if (!session?.user) return { success: false, error: "Unauthorized" };
  // ...
}
```

### 3b. Never trust client-supplied user IDs

Always derive the acting user's ID from the server session, not from the request payload.

---

## 4. Database Access

### 4a. Scope queries to the authenticated user

Every query that reads or mutates user-owned data must include the user's ID in the `where` clause.

```ts
// ❌ trusts client
await prisma.alert.delete({ where: { id: input.alertId } });

// ✅ scoped to session user
await prisma.alert.delete({
  where: { id: input.alertId, userId: session.user.id },
});
```

### 4b. Use transactions for multi-step mutations

```ts
await prisma.$transaction([
  prisma.order.create({ data: orderData }),
  prisma.inventory.update({ where: { id }, data: { stock: { decrement: 1 } } }),
]);
```

---

## 5. Cache Invalidation

- Call `revalidatePath("/relevant/path")` or `revalidateTag("tag")` after every mutation.
- Prefer `revalidateTag` for data shared across multiple paths.
- Do not `revalidatePath("/")` globally — be precise to avoid unnecessary re-rendering.

---

## 6. Error Handling

```ts
try {
  // db operation
} catch (err) {
  logger.error("createUser failed", { err, input: parsed.data });
  return { success: false, error: "Failed to create user. Please try again." };
}
```

- Log with context (which action, sanitised input) using the project logger.
- Return user-friendly error strings — never raw Prisma error messages.
