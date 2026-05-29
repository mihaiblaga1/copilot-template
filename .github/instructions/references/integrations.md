# Integration Settings

Central configuration for all MCP-backed and third-party tool integrations used by agents and skills in this project.

**How to use:** Agents and skills read this file before making any API calls to external tools. If a value is still a placeholder, the agent must call the relevant discovery API, print the results, ask the user to confirm the correct entry, and then update this file before proceeding.

> Fill this file during onboarding (the Onboarding Agent handles it). Once set, values here are treated as authoritative — agents must NOT override them by guessing.

---

## Linear

> Get these values by running `mcp_linear_list_teams` once during onboarding.

| Setting                  | Value                |
| ------------------------ | -------------------- |
| **Team Name**            | `[LINEAR_TEAM_NAME]` |
| **Team ID**              | `[LINEAR_TEAM_ID]`   |
| **Org / Workspace slug** | `[LINEAR_ORG_SLUG]`  |

**Rules for agents:**

- Always use the **Team ID** above when creating issues — never derive it by name-matching at runtime.
- If **Team ID** is still `[LINEAR_TEAM_ID]` (unfilled), do the following **before creating any ticket**:
  1. Call `mcp_linear_list_teams` and print the full list to the user.
  2. Ask: *"Which team should tickets be created under?"*
  3. Wait for confirmation, then update this file with the confirmed Team Name and Team ID.
  4. Only then proceed with ticket creation.
- Never create tickets in a team that was not explicitly confirmed by the user.

---

## GitHub

> Used by agents that open PRs, post comments, or reference repository URLs.

| Setting            | Value           |
| ------------------ | --------------- |
| **Org / Owner**    | `[GITHUB_ORG]`  |
| **Repo name**      | `[GITHUB_REPO]` |
| **Default branch** | `main`          |

---

<!-- Add new integration sections below as the project adopts more MCP-backed tools.
     Pattern: table of settings + agent rules (how to discover if unfilled, what to confirm). -->

<!--
## Example: Sentry

| Setting          | Value                 |
| ---------------- | --------------------- |
| **Org slug**     | `[SENTRY_ORG_SLUG]`  |
| **Project slug** | `[SENTRY_PROJECT]`   |

**Rules for agents:**
- Use org slug + project slug when calling any Sentry MCP tool.
- If unfilled, ask the user before proceeding.
-->
