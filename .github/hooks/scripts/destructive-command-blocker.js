#!/usr/bin/env node
/**
 * destructive-command-blocker.js
 *
 * PreToolUse hook — intercepts terminal tool calls and hard-blocks any command
 * that matches a known-destructive pattern (filesystem wipes, database drops,
 * forced pushes to protected branches, remote code execution, etc.).
 *
 * On detection : exits with code 2 and emits `deny` — no user prompt, instant block.
 * On clean input: exits with code 0 (allow).
 *
 * Only acts on terminal tools: run_in_terminal, send_to_terminal.
 */

"use strict";

// ---------------------------------------------------------------------------
// Tools this hook intercepts — all others are passed through immediately
// ---------------------------------------------------------------------------
const TERMINAL_TOOLS = new Set(["run_in_terminal", "send_to_terminal"]);

// ---------------------------------------------------------------------------
// Destructive patterns
// Each entry: { name, regex, note? }
// Patterns are intentionally tight to minimise false positives.
// ---------------------------------------------------------------------------
const PATTERNS = [
  // ── Filesystem wipes ───────────────────────────────────────────────────
  {
    name: "rm -rf on root, home, or bare wildcard",
    regex: /\brm\s+-\S*r\S*f\S*\s+(\/\s|~\s|\$HOME\s|\/\*|~\/\*|\s*$)/i,
    note: "Deletes the filesystem root, home directory, or everything in cwd.",
  },
  {
    name: "rm --no-preserve-root",
    regex: /\brm\b.*--no-preserve-root/i,
    note: "Explicitly disables the safety guard on rm -rf /.",
  },
  {
    name: "Disk format (mkfs)",
    regex: /\bmkfs(\.\w+)?\s+\/dev\//i,
    note: "Formats a disk partition, destroying all data on it.",
  },
  {
    name: "Raw disk overwrite (dd to device)",
    regex: /\bdd\b.*\bof\s*=\s*\/dev\//i,
    note: "Writes raw bytes directly to a disk device.",
  },
  {
    name: "chmod 777 on root or system directory",
    regex: /\bchmod\b.*\b777\b.*\s(\/|\/etc|\/usr|\/bin|\/sbin)\b/i,
    note: "Makes critical system paths world-writable.",
  },
  {
    name: "Fork bomb",
    regex: /:\s*\(\s*\)\s*\{[^}]*:\s*\|\s*:.*\}/,
    note: "Exponentially spawns processes until the system freezes.",
  },

  // ── System state ───────────────────────────────────────────────────────
  {
    name: "System shutdown / reboot",
    regex: /\b(shutdown|halt|poweroff|reboot)\b.*(\bnow\b|-[hHpPrRfF])/i,
    note: "Immediately powers off or reboots the machine.",
  },

  // ── Database destruction ───────────────────────────────────────────────
  {
    name: "SQL DROP DATABASE",
    regex: /\bDROP\s+DATABASE\b/i,
    note: "Permanently deletes an entire database and all its data.",
  },
  {
    name: "SQL DROP TABLE",
    regex: /\bDROP\s+TABLE\b/i,
    note: "Permanently deletes a table and all its rows.",
  },
  {
    name: "SQL TRUNCATE TABLE",
    regex: /\bTRUNCATE\s+(TABLE\s+)?\w+/i,
    note: "Deletes all rows in a table without a WHERE clause.",
  },
  {
    name: "Prisma migrate reset (drops all data)",
    regex: /\bprisma\s+migrate\s+reset\b/i,
    note: "Drops the database, recreates it, and re-seeds — all data lost.",
  },
  {
    name: "Prisma db push --force-reset",
    regex: /\bprisma\s+db\s+push\b.*--force-reset/i,
    note: "Resets the database schema without a migration history.",
  },

  // ── Git destructive ────────────────────────────────────────────────────
  {
    name: "Force push to main or master",
    regex:
      /\bgit\s+push\b.*--force(?:-with-lease)?\b.*\b(main|master)\b|\bgit\s+push\b.*\b(main|master)\b.*--force(?:-with-lease)?\b/i,
    note: "Overwrites the protected branch history on the remote.",
  },
  {
    name: "git reset --hard on a shared branch",
    regex: /\bgit\s+reset\s+--hard\b/i,
    note: "Discards committed and staged work permanently.",
  },
  {
    name: "Delete remote branch (main or master)",
    regex:
      /\bgit\s+push\b.*:(?:refs\/heads\/)?(main|master)\b|\bgit\s+push\b.*--delete\b.*(main|master)\b/i,
    note: "Deletes a protected branch from the remote.",
  },

  // ── Remote code execution ──────────────────────────────────────────────
  {
    name: "Piped remote script execution (curl/wget | sh)",
    regex: /(curl|wget)\b[^|]*\|\s*(sudo\s+)?(ba)?sh\b/i,
    note: "Fetches and immediately executes an arbitrary remote script.",
  },

  // ── System file overwrites ─────────────────────────────────────────────
  {
    name: "Overwrite critical system file",
    regex: />\s*\/etc\/(passwd|shadow|sudoers|hosts)\b/i,
    note: "Overwrites a critical system authentication or network file.",
  },
];

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
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
    process.exit(0); // unparseable — pass through
  }

  // Only intercept terminal tools
  const toolName = payload.toolName ?? payload.tool_name ?? "";
  if (!TERMINAL_TOOLS.has(toolName)) {
    process.exit(0);
  }

  // Extract the command string
  const input = payload.toolInput ?? payload.tool_input ?? {};
  const command =
    typeof input === "string"
      ? input
      : (input.command ?? JSON.stringify(input));

  if (!command) {
    process.exit(0);
  }

  // Scan for destructive patterns
  const hit = PATTERNS.find(({ regex }) => regex.test(command));

  if (!hit) {
    process.exit(0);
  }

  // Log to stderr for audit trail
  process.stderr.write(
    `[destructive-command-blocker] BLOCKED — pattern: "${hit.name}" | command: ${command.slice(0, 120)}\n`,
  );

  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: [
        `🚫 Destructive Command Blocker: this command was blocked.`,
        `Pattern matched: "${hit.name}".`,
        hit.note,
        `If you genuinely need to run this, execute it manually in a terminal — the agent must not run it autonomously.`,
      ].join(" "),
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(2);
});
