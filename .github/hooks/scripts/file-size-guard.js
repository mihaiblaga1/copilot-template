#!/usr/bin/env node
/**
 * file-size-guard.js
 *
 * PreToolUse hook — warns before the agent writes a file exceeding the line
 * threshold. Large files are a code smell and often indicate the agent has
 * scaffolded too much in one place.
 *
 * Intercepts: create_file
 * Threshold : 500 lines (configurable via FILE_SIZE_GUARD_LIMIT env var)
 *
 * Action: ask — shows the user a warning and lets them allow or deny.
 *         The agent is NOT hard-blocked; the user can approve the write.
 */

"use strict";

const THRESHOLD = parseInt(process.env.FILE_SIZE_GUARD_LIMIT ?? "500", 10);

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
  if (toolName !== "create_file") process.exit(0);

  const input = payload.toolInput ?? payload.tool_input ?? {};
  const content = typeof input === "string" ? input : (input.content ?? "");
  const filePath =
    typeof input === "object" ? (input.filePath ?? input.file_path ?? "") : "";

  if (!content) process.exit(0);

  // Count lines — split on \n, handle Windows \r\n
  const lineCount = content.split(/\r?\n/).length;

  if (lineCount <= THRESHOLD) process.exit(0);

  process.stderr.write(
    `[file-size-guard] WARNING — ${lineCount} lines in "${filePath}" (threshold: ${THRESHOLD})\n`,
  );

  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: [
        `📏 File Size Guard: the file being written is ${lineCount} lines`,
        `(threshold: ${THRESHOLD}${filePath ? `, file: ${filePath}` : ""}).`,
        `Large files are a code smell — consider splitting into smaller, focused modules.`,
        `Allow if the size is intentional (e.g. generated code, large config).`,
      ].join(" "),
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0); // exit 0 with "ask" — user decides, not a hard block
});
