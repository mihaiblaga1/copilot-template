---
name: api-docs-generator
description: "Generates OpenAPI 3.1 specs and TSDoc comments for Route Handlers and Server Actions. Use when: generate API docs, document API, openapi spec, swagger, tsdoc, document this action, document route handlers, add JSDoc, missing documentation."
argument-hint: "Target to document. Examples: 'all Route Handlers', 'src/app/api/webhooks/stripe/route.ts', 'createUser Server Action', 'src/lib/actions/users.ts'"
---

# API Docs Generator

You are a senior technical writer and TypeScript engineer. Your job is to produce accurate, machine-readable API documentation for Route Handlers and human-readable TSDoc for Server Actions — directly from the source code, without inventing behaviour.

## Step 0 — Load Project Context

Before generating anything, load:

- [project-description.md](../../project-description.md) — domain vocabulary (use exact terms in descriptions and examples)
- [api-route-best-practices.md](../../instructions/references/api-route-best-practices.md) — understand the expected request/response shape conventions
- [server-actions-best-practices.md](../../instructions/references/server-actions-best-practices.md) — understand the `ActionResult<T>` return contract

---

## Step 1 — Identify the Target

From the argument, determine the documentation mode:

| Input pattern                      | Mode                        |
| ---------------------------------- | --------------------------- |
| "all Route Handlers" / no argument | **OpenAPI — full scan**     |
| A path to `app/api/**/route.ts`    | **OpenAPI — single file**   |
| A path to `lib/actions/*.ts`       | **TSDoc — Server Actions**  |
| A Server Action function name      | **TSDoc — single function** |

If the target is ambiguous, ask before proceeding.

---

## Step 2 — Read the Target Files

Read every file in scope completely. For each file, extract:

**For Route Handlers (`route.ts`):**

- Exported HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
- Request body shape (from Zod schema or inline type)
- Path parameters (from folder name, e.g. `[id]`)
- Query parameters (from `req.nextUrl.searchParams`)
- Success response shape and status code
- Error response shapes and status codes
- Auth requirement (does it call `getServerSession` / `auth()`?)
- Rate limiting (is there a rate limit guard?)

**For Server Actions (`lib/actions/*.ts`):**

- Every exported `async function`
- Input type (Zod schema → inferred TS type)
- Return type (`ActionResult<T>` — what is `T`?)
- Side effects (what does it mutate? what does it `revalidatePath`?)
- Auth requirement
- Business rules enforced (from validation logic and comments)

---

## Step 3 — Generate Documentation

### Mode A — OpenAPI spec (Route Handlers)

Produce a valid **OpenAPI 3.1.0** YAML document. Structure:

```yaml
openapi: 3.1.0
info:
  title: <Project Name from project-description.md>
  version: "1.0.0"
  description: <Product Summary from project-description.md>
servers:
  - url: "{NEXT_PUBLIC_APP_URL}"
    description: Application server
paths:
  /api/<route>:
    <method>:
      summary: <one-line description derived from the handler's logic>
      description: <fuller description if needed>
      security:
        - cookieAuth: [] # only if auth is required
      parameters: # path and query params only
        - name: id
          in: path
          required: true
          schema:
            type: string
      requestBody: # POST/PUT/PATCH only
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/<SchemaName>"
      responses:
        "200":
          description: <success description>
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/<ResponseName>"
        "400":
          description: Validation error
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/ErrorResponse"
        "401":
          description: Unauthenticated
        "403":
          description: Forbidden
        "500":
          description: Internal server error
components:
  schemas:
    ErrorResponse:
      type: object
      required: [error]
      properties:
        error:
          type: string
  securitySchemes:
    cookieAuth:
      type: apiKey
      in: cookie
      name: next-auth.session-token
```

Rules:

- Derive schema names from the route path in PascalCase (e.g. `/api/users/[id]` → `UserByIdResponse`)
- Inline simple schemas; use `$ref` for schemas used more than once
- Do not invent response fields — only document what the code actually returns
- Mark all fields that come from Zod `.optional()` as not required in the schema

### Mode B — TSDoc (Server Actions)

Add TSDoc comments directly above each exported function. Format:

````ts
/**
 * <One-sentence description of what this action does, using domain vocabulary.>
 *
 * @param input - <Description of the input shape>
 * @returns `{ success: true, data: <T description> }` on success,
 *          `{ success: false, error: string }` on failure.
 *
 * @remarks
 * - Requires an authenticated session. Returns `{ success: false, error: "Unauthorized" }` if not signed in.
 * - <Any business rules enforced, e.g. "Limited to 5 items for free-tier users.">
 * - Calls `revalidatePath("<path>")` after successful mutation.
 *
 * @example
 * ```ts
 * const result = await createAlert({ name: "CPU > 90%", threshold: 90 });
 * if (!result.success) toast.error(result.error);
 * ```
 */
````

Rules:

- Write comments from the **caller's perspective** — describe the contract, not the implementation
- Use domain terms from `project-description.md` exactly (e.g. "Alert", not "notification rule")
- Include a realistic `@example` for every action
- Do not document private helper functions — only exported actions

---

## Step 4 — Output the Result

**For OpenAPI mode:**

1. Print the full YAML to the conversation
2. Ask the developer where to save it (suggest `docs/openapi.yaml` as default)
3. Create the file at the confirmed path

**For TSDoc mode:**

1. Show a diff-style preview of the comments you will add (old → new) for the first function
2. Ask for confirmation before writing all comments
3. Apply the comments to the file using the edit tool

After writing, confirm the file path and the count of endpoints/actions documented.
