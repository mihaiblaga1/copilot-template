#!/usr/bin/env node
/**
 * secret-leak-guard.js
 *
 * PreToolUse hook — scans every tool call payload for common API key and secret
 * patterns before the agent writes them to a file, terminal, or any output.
 *
 * On detection: exits with code 0 and emits an `ask` permissionDecision,
 *   prompting the user to allow or deny the tool call.
 * On clean input: exits with code 0 (allow).
 */

"use strict";

// ---------------------------------------------------------------------------
// Patterns — ordered from most specific (low false-positive) to least specific
// ---------------------------------------------------------------------------
const PATTERNS = [
  // Vendor-prefixed keys (very high confidence)
  { name: "OpenAI API key", regex: /sk-[A-Za-z0-9]{20,}/ },
  { name: "Anthropic API key", regex: /sk-ant-[A-Za-z0-9_-]{20,}/ },
  { name: "Stripe live secret key", regex: /sk_live_[A-Za-z0-9]{24,}/ },
  { name: "Stripe live public key", regex: /pk_live_[A-Za-z0-9]{24,}/ },
  { name: "Stripe test secret key", regex: /sk_test_[A-Za-z0-9]{24,}/ },
  { name: "AWS Access Key ID", regex: /AKIA[0-9A-Z]{16}/ },
  { name: "AWS Secret Access Key", regex: /[A-Za-z0-9/+=]{40}(?=["'\s]|$)/ },
  { name: "GitHub personal token", regex: /ghp_[A-Za-z0-9]{36,}/ },
  { name: "GitHub OAuth token", regex: /gho_[A-Za-z0-9]{36,}/ },
  { name: "GitHub Actions token", regex: /ghs_[A-Za-z0-9]{36,}/ },
  { name: "GitHub refresh token", regex: /ghr_[A-Za-z0-9]{36,}/ },
  { name: "npm token", regex: /npm_[A-Za-z0-9]{36,}/ },
  { name: "Vercel token", regex: /vercel_[A-Za-z0-9_-]{24,}/ },
  { name: "Twilio Account SID", regex: /AC[a-f0-9]{32}/ },
  { name: "Twilio Auth Token", regex: /SK[a-f0-9]{32}/ },
  {
    name: "SendGrid API key",
    regex: /SG\.[A-Za-z0-9_-]{22,}\.[A-Za-z0-9_-]{43,}/,
  },
  { name: "Resend API key", regex: /re_[A-Za-z0-9]{20,}/ },

  // Structural patterns (high confidence regardless of vendor)
  {
    name: "PEM private key block",
    regex: /-----BEGIN\s+(RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  },
  {
    name: "Bearer token in header",
    regex: /Authorization:\s*Bearer\s+[A-Za-z0-9\-_.]{20,}/i,
  },

  // Generic assignment patterns — only flag when the value is non-placeholder
  {
    name: "Secret/key assignment with real-looking value",
    regex:
      /(?:SECRET|API_KEY|PRIVATE_KEY|ACCESS_TOKEN|AUTH_TOKEN|SERVICE_ACCOUNT)\s*[:=]\s*["']?([A-Za-z0-9_\-./+]{20,})["']?/i,
    extractValue: (match) => match[1],
  },
  {
    name: "Password assignment with real-looking value",
    regex:
      /(?:PASSWORD|PASSWD|DB_PASS(?:WORD)?)\s*[:=]\s*["']?([^\s"'<>{}\[\]]{8,})["']?/i,
    extractValue: (match) => match[1],
  },
];

// ---------------------------------------------------------------------------
// Placeholder detection — values that look like real secrets but are examples
// ---------------------------------------------------------------------------
const PLACEHOLDER_RE = [
  /your[_-]?.*[_-]?here/i,
  /^x{3,}$/i,
  /^<[^>]+>$/,
  /placeholder/i,
  /changeme/i,
  /example/i,
  /^[*]+$/,
  /^\.{3,}$/,
  /^(none|null|undefined|empty|todo)$/i,
];

function isPlaceholder(value) {
  return PLACEHOLDER_RE.some((re) => re.test(value.trim()));
}

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
    // Unparseable input — pass through to avoid blocking the agent entirely
    process.exit(0);
  }

  // Stringify the full tool input so we scan all nested string values
  const content = JSON.stringify(
    payload.toolInput ?? payload.tool_input ?? payload,
  );

  const hits = [];

  for (const pattern of PATTERNS) {
    const match = content.match(pattern.regex);
    if (!match) continue;

    // For patterns that extract the actual secret value, check if it looks
    // like a placeholder before flagging
    if (pattern.extractValue) {
      const value = pattern.extractValue(match);
      if (!value || isPlaceholder(value)) continue;
    }

    hits.push(pattern.name);
  }

  if (hits.length === 0) {
    process.exit(0);
  }

  // Secret detected — log to stderr and ask the user for permission
  process.stderr.write(
    `[secret-leak-guard] Potential secret detected — pattern(s): ${hits.join("; ")}\n`,
  );

  const output = {
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "ask",
      permissionDecisionReason: [
        `⚠️  Secret Leak Guard detected a potential secret in this tool call.`,
        `Pattern(s) matched: ${hits.join("; ")}.`,
        "If this is a real secret, cancel and use an environment variable (e.g. process.env.MY_SECRET) instead.",
        "If this is a placeholder or example value, you can safely allow.",
      ].join(" "),
    },
  };

  process.stdout.write(JSON.stringify(output));
  process.exit(0);
});
