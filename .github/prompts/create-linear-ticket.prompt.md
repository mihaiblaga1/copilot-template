---
name: "Create Linear Ticket"
description: "Create a single, well-structured Linear ticket from Copilot chat. Interviews you for title, description, priority, layer, and labels, then creates the ticket using the canonical linear-ticket-writer format. Use when: create a ticket, new linear issue, log a bug, file a ticket, track this issue, add to backlog."
tools: [read, "linear/*"]
---

# Create Linear Ticket

Your job is to create one well-structured Linear ticket based on information provided by the user. Load the shared format and then interview the user for the required fields.

---

## Step 0 — Load the Ticket Format

Read [linear-ticket-writer](../skills/linear-ticket-writer/SKILL.md) in full. You will use its pre-creation steps, title format, description template, priority mapping, and label strategy.

---

## Step 1 — Gather Information

Ask the user **all of the following in one message**. Wait for all answers before proceeding.

```
1. Title — one short imperative sentence (e.g. "Fix missing session check in billing action")
   This will be formatted as: [FeatureName] Title

2. Feature / area — which part of the app does this relate to? (e.g. "Billing", "Alerts", "Auth")

3. What needs to happen? — one sentence describing what to build or fix

4. Problem — why does this matter? What breaks or degrades without this fix?

5. File / location — which file(s) are affected? (or "N/A" if unknown)

6. Severity — Critical | High | Medium | Low

7. Layer — Architecture | Security | Performance | Error Handling | Data Integrity | Product | Accessibility | i18n

8. Suggested fix — concrete recommendation, code snippet optional (or "N/A" if unknown)

9. Effort estimate — Low | Medium | High

10. Labels — any specific labels to apply? (e.g. "bug", "enhancement", "tech-debt")
    Leave blank to use the defaults from the label strategy.

11. Source — what triggered this ticket? (e.g. "Found during code review", "Reported by user", "Security audit")
```

---

## Step 2 — Confirm Before Creating

Show the user the final title and description in the template format before creating. Ask them to confirm or correct it.

Use the title format from the linear-ticket-writer skill:

```
[{FeatureName}] {Title}
```

And the full description template with all fields populated from the interview.

---

## Step 3 — Create the Ticket

Follow the linear-ticket-writer skill's **Pre-Creation Steps** (discover team, discover labels, create feature label if needed), then call `mcp_linear_save_issue` with the confirmed title and description.

Use the priority mapping from the skill based on the severity provided in Q6.

After creation, output the ticket ID and URL.
