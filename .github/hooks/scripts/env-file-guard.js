#!/usr/bin/env node
/**
 * env-file-guard.js
 *
 * PreToolUse hook — prevents the agent from reading real environment files
 * (.env, .env.local, .env.production, .env.staging, etc.) that contain
 * actual secret values.
 *
 * .env.example is explicitly allowed — it contains only placeholder values.
 *
 * Intercepts:
 *   - read_file         (direct file read by path)
 *   - run_in_terminal   (cat, type, Get-Content targeting an env file)
 *   - send_to_terminal  (same)
 *
 * Action: hard deny — no user prompt.
 */

"use strict";

const TERMINAL_TOOLS = new Set(["run_in_terminal", "send_to_terminal"]);

// Matches .env, .env.local, .env.production, .env.staging, .env.test, etc.
// Does NOT match .env.example
const ENV_FILE_RE = /(?:^|[/\\])\.env(?:\.[a-z]+)?$/i;
const ENV_EXAMPLE_RE = /\.env\.example$/i;

// Terminal commands that read file contents
const TERMINAL_READ_RE =
  /\b(?:cat|type|Get-Content|gc|more|less|head|tail)\s+["']?([^\s"'|&;]+\.env(?:\.[a-z]+)?)["']?/i;

function isEnvFile(filePath) {
  if (!filePath || ENV_EXAMPLE_RE.test(filePath)) return false;
  return ENV_FILE_RE.test(filePath);
}

function deny(reason) {
  process.stderr.write(`[env-file-guard] BLOCKED — ${reason}\n`);
  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: [
        `🔒 Env File Guard: reading environment files is not allowed.`,
        reason,
        `Use process.env.VARIABLE_NAME in code, or check .env.example for the list of required variables.`,
      ].join(" "),
    },
  };
  process.stdout.write(JSON.stringify(output));
  process.exit(2);
}

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
  const input = payload.toolInput ?? payload.tool_input ?? {};

  // ── read_file ────────────────────────────────────────────────────────────
  if (toolName === "read_file") {
    const filePath =
      typeof input === "string"
        ? input
        : (input.filePath ?? input.file_path ?? "");
    if (isEnvFile(filePath)) {
      deny(
        `Attempted to read "${filePath}" which is an environment secrets file.`,
      );
    }
    process.exit(0);
  }

  // ── terminal tools ───────────────────────────────────────────────────────
  if (TERMINAL_TOOLS.has(toolName)) {
    const command = typeof input === "string" ? input : (input.command ?? "");
    const match = command.match(TERMINAL_READ_RE);
    if (match && !ENV_EXAMPLE_RE.test(match[1])) {
      deny(
        `Terminal command attempted to read "${match[1]}" which is an environment secrets file.`,
      );
    }
    process.exit(0);
  }

  process.exit(0);
});
