#!/usr/bin/env node
/**
 * no-direct-db-push.js
 *
 * PreToolUse hook — hard-blocks `prisma db push` in all its forms.
 *
 * Why: `prisma db push` bypasses Prisma Migrate's migration history, making
 * schema changes untraceable and non-reproducible across environments.
 * All schema changes must go through `prisma migrate dev`.
 *
 * Note: `prisma db push --force-reset` is already covered by
 * destructive-command-blocker.js. This hook covers the non-reset forms.
 *
 * Action: hard deny — no user prompt.
 */

"use strict";

const TERMINAL_TOOLS = new Set(["run_in_terminal", "send_to_terminal"]);

// Matches any form of "prisma db push" — with or without flags
const PATTERN = /\bprisma\s+db\s+push\b/i;

let raw = "";
process.stdin.setEncoding("utf8");
process.stdin.on("data", (chunk) => {
  raw += chunk;
});
process.stdin.on("end", () => {
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    process.exit(0);
  }

  const toolName = payload.toolName ?? payload.tool_name ?? "";
  if (!TERMINAL_TOOLS.has(toolName)) process.exit(0);

  const input = payload.toolInput ?? payload.tool_input ?? {};
  const command = typeof input === "string" ? input : (input.command ?? "");
  if (!command) process.exit(0);

  if (!PATTERN.test(command)) process.exit(0);

  process.stderr.write(
    `[no-direct-db-push] BLOCKED — prisma db push | command: ${command.slice(0, 120)}\n`,
  );

  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: [
        `🗄️ DB Push Guard: \`prisma db push\` is not allowed.`,
        `It bypasses the migration history, making schema changes untraceable across environments.`,
        `Use \`prisma migrate dev --name <description>\` instead to create a tracked migration.`,
      ].join(" "),
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(2);
});
