# Database & Prisma Best Practices

Apply this reference whenever writing or reviewing Prisma schema, queries, or migrations.

---

## 1. Schema Design

### 1a. Always include audit fields

Every model that represents user-created content should have:

```prisma
model Alert {
  id        String    @id @default(cuid())
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  deletedAt DateTime? // soft-delete — never hard delete
}
```

### 1b. Use `cuid()` or `uuid()` for primary keys

Avoid auto-increment integers for IDs exposed in URLs — they leak record counts and are easy to enumerate.

### 1c. Index foreign keys and frequently filtered fields

```prisma
model Alert {
  userId String
  status AlertStatus

  @@index([userId])
  @@index([userId, status]) // composite for common filter combos
}
```

### 1d. Enforce uniqueness in the schema, not only in application code

```prisma
model User {
  email String @unique
}
```

---

## 2. Querying

### 2a. Select only the fields you need

```ts
// ❌ fetches all columns
const user = await prisma.user.findUnique({ where: { id } });

// ✅ project to DTO
const user = await prisma.user.findUnique({
  where: { id },
  select: { id: true, name: true, email: true },
});
```

### 2b. Avoid N+1 — use `include` or nested selects

```ts
// ❌ N+1: one query per alert
const alerts = await prisma.alert.findMany();
for (const a of alerts) {
  const owner = await prisma.user.findUnique({ where: { id: a.userId } });
}

// ✅ single query with relation
const alerts = await prisma.alert.findMany({
  include: { user: { select: { name: true } } },
});
```

### 2c. Paginate large result sets

Never fetch unbounded lists. Always apply `take` + `skip` or cursor-based pagination.

```ts
const alerts = await prisma.alert.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: "desc" },
});
```

### 2d. Soft-delete filter

Always exclude soft-deleted records by default:

```ts
where: { deletedAt: null, ...otherFilters }
```

Consider a Prisma middleware or extension to apply this automatically.

---

## 3. Migrations

- Run `prisma migrate dev --name <descriptive-name>` — never edit migration files by hand.
- Review the generated SQL before applying to production.
- Never use `prisma db push` in production — it bypasses the migration history.
- Keep `prisma/migrations/` committed to source control.

---

## 4. Client Singleton

Use a single Prisma client instance to avoid exhausting the connection pool:

```ts
// src/lib/db/client.ts
import "server-only";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 5. DTOs — Never Expose Raw Models

Map Prisma results to plain DTO types before returning from Server Actions or Server Components:

```ts
type UserDTO = { id: string; name: string; email: string };

function toUserDTO(user: PrismaUser): UserDTO {
  return { id: user.id, name: user.name, email: user.email };
}
```
