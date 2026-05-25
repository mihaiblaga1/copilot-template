# Project Description

> **Instructions for the person filling this in:**
> Replace every `<!-- [...] -->` placeholder with real content. This file is loaded by every agent, skill, and prompt in this template to provide product and domain context. The quality of AI-generated output is directly proportional to the quality of what you write here. Be specific.

---

## Product Overview

<!-- [PRODUCT_NAME]: The name of the product / application -->

**Name:** `[PRODUCT_NAME]`

<!-- [PRODUCT_SUMMARY]: 2–4 sentences. What does it do? What problem does it solve? -->

**What it does:**

> [PRODUCT_SUMMARY]

<!-- [PRIMARY_USERS]: Who are the end users? (e.g. "SMB ops teams", "individual developers", "finance managers at mid-market SaaS companies") -->

**Primary users:** `[PRIMARY_USERS]`

<!-- [USER_GOAL]: The single most important thing a user wants to accomplish in this app in one sentence. -->

**Core user goal:** `[USER_GOAL]`

---

## Key Domain Concepts & Glossary

> Agents and AI tools use this glossary to name types, variables, routes, and UI copy correctly. Be precise — ambiguous terms produce inconsistent code.

<!-- Add one row per core domain concept. Examples below. -->

| Term                           | Definition                                                                                                                           |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| <!-- e.g. Alert --> `[TERM_1]` | <!-- e.g. A threshold-based notification rule tied to a metric. Triggers when the metric crosses the threshold. --> `[DEFINITION_1]` |
| `[TERM_2]`                     | `[DEFINITION_2]`                                                                                                                     |
| `[TERM_3]`                     | `[DEFINITION_3]`                                                                                                                     |
| `[TERM_4]`                     | `[DEFINITION_4]`                                                                                                                     |
| `[TERM_5]`                     | `[DEFINITION_5]`                                                                                                                     |

---

## Feature Areas

> List the main feature areas / modules that exist (or are planned) in the app. Used by scaffold and analysis tools to understand project scope.

<!-- Replace with real feature areas. Each bullet = one route group / domain. -->

- `[FEATURE_1]` — <!-- e.g. Dashboard: overview metrics and activity feed -->
- `[FEATURE_2]` — <!-- e.g. Alerts: create, manage, and silence threshold alerts -->
- `[FEATURE_3]` — <!-- e.g. Settings: user profile, billing, team management -->
- `[FEATURE_4]` — <!-- e.g. Reports: scheduled and on-demand data exports -->
- `[FEATURE_5]` — <!-- e.g. Integrations: connect third-party data sources -->

---

## Business Rules That Affect Development

> Rules here override or constrain technical decisions. Agents must respect them when generating or reviewing code.

<!-- Add bullet points for each business rule. Examples: -->

- <!-- e.g. "All data is scoped to the user's Organisation. A user must never be able to read or mutate another org's data." -->
- <!-- e.g. "Free-tier users are limited to 5 active Alerts. Enforce this in the Server Action, not just the UI." -->
- <!-- e.g. "Deleted records must be soft-deleted (deletedAt) — hard deletes are never permitted." -->
- <!-- e.g. "Reports older than 90 days are automatically archived and cannot be downloaded without an admin override." -->
- `[RULE_1]`
- `[RULE_2]`

---

## Multi-Tenancy & Data Scoping

<!-- [TENANCY_MODEL]: Describe how data is isolated between users/organisations.
     Examples: "Single-tenant (one DB per org)", "Row-level isolation via orgId foreign key", "RLS via Postgres policies", "No multi-tenancy — single user app" -->

**Tenancy model:** `[TENANCY_MODEL]`

<!-- [SCOPE_FIELD]: The field used to scope DB queries (e.g. "orgId", "userId", "teamId", or "N/A") -->

**Scope field on DB queries:** `[SCOPE_FIELD]`

---

## External Integrations & Third-Party Services

> Agents use this to understand which packages are business-critical and what external calls look like.

<!-- List every third-party service the app integrates with. Add rows as needed. -->

| Service                            | Purpose                                          | SDK / package                      |
| ---------------------------------- | ------------------------------------------------ | ---------------------------------- |
| <!-- e.g. Stripe --> `[SERVICE_1]` | <!-- e.g. Subscription billing --> `[PURPOSE_1]` | <!-- e.g. stripe --> `[PACKAGE_1]` |
| `[SERVICE_2]`                      | `[PURPOSE_2]`                                    | `[PACKAGE_2]`                      |
| `[SERVICE_3]`                      | `[PURPOSE_3]`                                    | `[PACKAGE_3]`                      |

---

## User Roles & Permissions

<!-- [ROLES]: Describe each role and what it can do. If there's no RBAC, write "No roles — single user type." -->

| Role       | Capabilities       |
| ---------- | ------------------ |
| `[ROLE_1]` | `[CAPABILITIES_1]` |
| `[ROLE_2]` | `[CAPABILITIES_2]` |

---

## Non-Goals / Out of Scope

> Things this product deliberately does NOT do. Prevents agents from scaffolding features that don't belong here.

<!-- Examples: "No mobile app — web only", "No real-time collaboration", "No public API for external consumers" -->

- `[NON_GOAL_1]`
- `[NON_GOAL_2]`

---

## Links & External Resources

<!-- Add links to design files, product specs, API docs, etc. -->

| Resource              | URL              |
| --------------------- | ---------------- |
| Figma / Design file   | `[FIGMA_URL]`    |
| Product spec / Notion | `[NOTION_URL]`   |
| API documentation     | `[API_DOCS_URL]` |
| Staging environment   | `[STAGING_URL]`  |
