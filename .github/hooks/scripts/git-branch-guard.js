#!/usr/bin/env node
/**
 * git-branch-guard.js
 *
 * PreToolUse hook — blocks the agent from switching to or working directly
 * on protected branches (main, master, develop) via terminal commands.
 *
 * Blocked: git checkout <protected>, git switch <protected>, git merge <protected>
 * Allowed: git checkout -b <new-branch>, git rebase <protected> (updating a feature branch)
 *
 * Action: hard deny — no user prompt.
 */

"use strict";

const TERMINAL_TOOLS = new Set(["run_in_terminal", "send_to_terminal"]);

// Branches considered protected — extend as needed for your project
const PROTECTED = "(main|master|develop)";

const PATTERNS = [
  {
    name: `git checkout to protected branch`,
    // Matches "git checkout main" but NOT "git checkout -b feat/foo" or "git checkout -b feat/foo main"
    regex: new RegExp(`\\bgit\\s+checkout\\s+${PROTECTED}\\b`, "i"),
    note: "Switches the working tree directly to a protected branch. Always work on a feature branch instead.",
  },
  {
    name: `git switch to protected branch`,
    // Matches "git switch main" but NOT "git switch -c feat/foo"
    regex: new RegExp(`\\bgit\\s+switch\\s+(?!-c\\s)${PROTECTED}\\b`, "i"),
    note: "Switches directly to a protected branch. Use a feature branch.",
  },
  {
    name: `git merge from protected branch`,
    regex: new RegExp(`\\bgit\\s+merge\\s+(?:--\\S+\\s+)*${PROTECTED}\\b`, "i"),
    note: "Merges a protected branch into the current branch. Open a PR instead of merging locally.",
  },
];

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

  const hit = PATTERNS.find(({ regex }) => regex.test(command));
  if (!hit) process.exit(0);

  process.stderr.write(
    `[git-branch-guard] BLOCKED — "${hit.name}" | command: ${command.slice(0, 120)}\n`,
  );

  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: [
        `🛡️ Git Branch Guard: blocked "${hit.name}".`,
        hit.note,
        `Create or switch to a feature branch (e.g. git checkout -b feat/my-change) and work from there.`,
      ].join(" "),
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(2);
});
