# Database / Prisma Performance Anti-patterns

Apply this checklist to every file in `actions/`, `lib/`, and server components that contain Prisma or raw SQL queries.

---

## 1. N+1 Queries

### 1a. Loop containing individual DB calls

**Pattern:** A `for` / `forEach` / `Promise.all(array.map(...))` that issues one Prisma query per iteration.
**Detection:**

```ts
// Red flag — one query per item
for (const user of users) {
  const events = await prisma.aiEvent.findMany({ where: { userId: user.id } });
}
```

**Impact:** High — O(n) round-trips to the database; catastrophic at scale.
**Fix:** Batch with `where: { userId: { in: userIds } }` and group in JS, or use a single `include`.

### 1b. Missing `include` — separate queries for related data

**Pattern:** Fetching a record then issuing another query for its relations in the same function.
**Detection:** Two sequential `prisma.X.find*` calls where the second query uses an ID from the first result.
**Impact:** High — always 2× the round-trips.
**Fix:** Use `include: { relation: true }` or `select` with nested fields in a single query.

---

## 2. Over-fetching

### 2a. `findMany` without `select` — fetches all columns

**Pattern:** `prisma.aiEvent.findMany({ where: { ... } })` with no `select` or `omit`.
**Detection:** Any `findMany` / `findFirst` / `findUnique` without a `select` clause where only a subset of columns is used in the calling code.
**Impact:** Medium — serialises and transfers unused data; slower for wide tables like `AiEvent`.
**Fix:** Add `select: { id: true, model: true, cost: true, ... }` with only the fields actually consumed.

### 2b. `include` that pulls an entire relation when only one field is needed

**Pattern:** `include: { user: true }` when only `user.name` is used.
**Detection:** `include: { X: true }` in query, but only `result.X.someField` is accessed in the code.
**Impact:** Medium — fetches all columns of the related model unnecessarily.
**Fix:** Replace with `select: { user: { select: { name: true } } }`.

### 2c. Unbounded query — no `take` limit

**Pattern:** `prisma.aiEvent.findMany({ where: { orgId } })` with no `take` or `skip`.
**Detection:** `findMany` on high-volume models (`AiEvent`, `ModelPricing`) without `take`.
**Impact:** High — returns every row; will OOM the server as data grows.
**Fix:** Always add `take: pageSize, skip: page * pageSize` for paginated access.

---

## 3. Inefficient Raw Queries (`$queryRaw`)

### 3a. Raw query missing an index on the filter column

**Pattern:** `WHERE "orgId" = $1 AND "createdAt" > $2` on a column without an index.
**Detection:** Look at the `WHERE` / `ORDER BY` columns in raw SQL. Cross-reference with `prisma/schema.prisma` — check for `@@index([column])` or `@unique` on those fields.
**Impact:** High — full table scan on every request.
**Fix:** Add `@@index([orgId, createdAt])` to the Prisma schema and run `prisma migrate dev`.

### 3b. `SELECT *` in raw query

**Pattern:** `SELECT * FROM "AiEvent" WHERE ...`
**Detection:** `SELECT *` in any `$queryRaw` template literal.
**Impact:** Medium — transfers all columns, increases network payload and deserialisation time.
**Fix:** List only the columns needed: `SELECT id, model, cost, "createdAt" FROM "AiEvent" WHERE ...`.

### 3c. Raw query used where Prisma Client would be sufficient

**Pattern:** A raw query that does a simple `SELECT` with no aggregations, joins, or window functions.
**Detection:** `$queryRaw` used for plain `findMany`-equivalent logic (single table, simple WHERE, no GROUP BY).
**Impact:** Low — bypasses Prisma's type safety and query optimisation hints; harder to maintain.
**Fix:** Replace with `prisma.model.findMany({ where, select, take, skip })`.

---

## 4. Missing Parallelism

### 4a. Sequential awaits for independent queries

**Pattern:** Two or more `await prisma.X.find*()` calls in sequence where neither result depends on the other.
**Detection:**

```ts
// Red flag
const users = await prisma.user.findMany(...);
const events = await prisma.aiEvent.findMany(...);
```

**Impact:** Medium — total time = sum of latencies instead of max.
**Fix:** `const [users, events] = await Promise.all([prisma.user.findMany(...), prisma.aiEvent.findMany(...)])`.

---

## 5. Transaction Misuse

### 5a. Multiple writes outside a transaction

**Pattern:** Several `prisma.X.create/update/delete` calls in sequence without `prisma.$transaction([...])`.
**Detection:** 3+ mutating Prisma calls in the same function body without a wrapping `$transaction`.
**Impact:** Medium — partial failure leaves DB in inconsistent state; each call is a separate round-trip.
**Fix:** Wrap in `await prisma.$transaction([op1, op2, op3])` or use interactive transactions.

---

## 6. Query Duplication

### 6a. Same query issued in multiple server actions / components

**Pattern:** Identical `where` clauses fetching the same data in two or more places without a shared utility.
**Detection:** Grep for the same model name + where conditions appearing in multiple files.
**Impact:** Low–Medium — duplicate DB load; harder to optimise in one place.
**Fix:** Extract to a shared `lib/queries/X.ts` helper and import it everywhere.
