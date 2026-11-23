#!/usr/bin/env node
// check:model-ids — finds model IDs written anywhere except src/lib/ai/model-allowlist.ts
// (spec 001, C8, requirements 6.1 to 6.7).
//
// Usage: node scripts/check-model-ids.mjs [--root <dir>]
// Exit codes: 0 no findings, 1 at least one finding, 2 usage error or environment failure.
//
// Candidates are the files git lists (tracked, plus untracked that are not ignored), so a local
// .env.local that git ignores is never read (ADR-6). Two kinds of match are reported:
//   allowlist  an ID registered in the allowlist
//   pattern:<provider>  a string that follows a provider's naming scheme but is not registered
//
// The patterns below are assembled from fragments so that no fragment is a model name, which keeps
// this file from matching itself. The script is scanned like any other file.

import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const ALLOWLIST_PATH = "src/lib/ai/model-allowlist.ts";
const USAGE = "usage: node scripts/check-model-ids.mjs [--root <dir>]";

/** Directories whose files are scanned (everything below them). */
const SCANNED_DIRS = ["src/", "scripts/", "tests/", "docs/", ".github/"];
/** Individual files at the root that are scanned. */
const SCANNED_FILES = new Set(["README.md", ".env.example"]);
/** Root-level files with these extensions are scanned (configuration files). */
const ROOT_CONFIG_EXTENSION = /\.(ts|mts|cts|js|mjs|cjs|json|jsonc|yaml|yml|toml)$/;

/** Never scanned, even when they match a rule above. */
const EXCLUDED_FILES = new Set([ALLOWLIST_PATH, "pnpm-lock.yaml"]);
const EXCLUDED_PREFIXES = ["tests/fixtures/"];

// Naming schemes. Each entry is [provider, regular expression source]. The lookbehind and lookahead
// keep a match from starting or ending inside a longer token. They treat `-` as part of a token, which
// \b does not: \b would report an ID that is merely the tail of a hyphenated word. Japanese text
// needs no special care, because \b and these both match next to CJK characters (measured).
const START = "(?<![A-Za-z0-9_-])";
const END = "(?![A-Za-z0-9_-])";
const NUM = "[0-9]+(?:\\.[0-9]+)*";
const SUFFIX = "(?:[-:][A-Za-z0-9.]+)*";

const PATTERNS = [
  ["openai", `${START}${["g", "pt"].join("")}-${NUM}${SUFFIX}${END}`],
  ["openai", `${START}${["g", "pt"].join("")}-oss${SUFFIX}${END}`],
  ["openai", `${START}o${NUM}${SUFFIX}${END}`],
  ["openai", `${START}${["chat", "gpt"].join("")}-[A-Za-z0-9.-]+${END}`],
  [
    "anthropic",
    `${START}${["cl", "aude"].join("")}-(?:${["opus", "sonnet", "haiku", "fable", "mythos", "instant"].join("|")}|${NUM})${SUFFIX}${END}`,
  ],
  ["google", `${START}${["gem", "ini"].join("")}-${NUM}${SUFFIX}${END}`],
  ["google", `${START}${["gem", "ma"].join("")}-${NUM}${SUFFIX}${END}`],
  [
    "ollama",
    `${START}(?:${[
      ["l", "lama"].join(""),
      ["code", "llama"].join(""),
      ["mis", "tral"].join(""),
      ["mix", "tral"].join(""),
      ["qw", "en"].join(""),
      ["ph", "i"].join(""),
      ["deep", "seek-r"].join(""),
      ["deep", "seek-coder"].join(""),
      ["gem", "ma"].join(""),
      ["gran", "ite"].join(""),
      ["smol", "lm"].join(""),
    ].join("|")})${NUM}${SUFFIX}${END}`,
  ],
  [
    "ollama",
    `${START}(?:${[["mis", "tral"].join(""), ["mix", "tral"].join("")].join("|")}):[A-Za-z0-9.]+${END}`,
  ],
];

class UsageError extends Error {}
class EnvironmentError_ extends Error {}

function parseArguments(argv) {
  let root = process.cwd();
  for (let i = 0; i < argv.length; i++) {
    const argument = argv[i];
    if (argument === "--root") {
      const value = argv[i + 1];
      if (value === undefined || value.startsWith("--")) throw new UsageError(USAGE);
      root = resolve(value);
      i++;
    } else {
      throw new UsageError(USAGE);
    }
  }
  return root;
}

function listCandidateFiles(root) {
  const result = spawnSync(
    "git",
    ["-C", root, "ls-files", "--cached", "--others", "--exclude-standard", "-z"],
    { encoding: "utf8", maxBuffer: 256 * 1024 * 1024 },
  );
  if (result.error || result.status !== 0) {
    const reason = result.error ? result.error.message : result.stderr.trim();
    throw new EnvironmentError_(`git could not list the files of ${root}: ${reason}`);
  }
  return [...new Set(result.stdout.split("\0").filter((file) => file !== ""))].sort();
}

function isScanTarget(path) {
  if (EXCLUDED_FILES.has(path)) return false;
  if (EXCLUDED_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;
  if (SCANNED_DIRS.some((dir) => path.startsWith(dir))) return true;
  if (SCANNED_FILES.has(path)) return true;
  return !path.includes("/") && ROOT_CONFIG_EXTENSION.test(path);
}

async function loadAllowlist(root) {
  const file = join(root, ALLOWLIST_PATH);
  let module;
  try {
    module = await import(pathToFileURL(file).href);
  } catch (error) {
    throw new EnvironmentError_(
      `could not load ${ALLOWLIST_PATH} from ${root}: ${error instanceof Error ? error.message : error}`,
    );
  }
  const allowlist = module.MODEL_ALLOWLIST;
  if (typeof allowlist !== "object" || allowlist === null) {
    throw new EnvironmentError_(`${ALLOWLIST_PATH} does not export an object MODEL_ALLOWLIST`);
  }
  const ids = [];
  for (const [provider, list] of Object.entries(allowlist)) {
    if (!Array.isArray(list) || !list.every((id) => typeof id === "string" && id !== "")) {
      throw new EnvironmentError_(
        `${ALLOWLIST_PATH}: MODEL_ALLOWLIST.${provider} must be an array of non-empty strings`,
      );
    }
    ids.push(...list);
  }
  if (ids.length === 0) {
    throw new EnvironmentError_(`${ALLOWLIST_PATH}: MODEL_ALLOWLIST holds no model IDs`);
  }
  return ids;
}

function escapeRegExp(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildMatchers(allowlistIds) {
  const longestFirst = [...allowlistIds].sort((a, b) => b.length - a.length);
  const allowlistMatcher = new RegExp(
    `${START}(?:${longestFirst.map(escapeRegExp).join("|")})${END}`,
    "g",
  );
  const patternMatchers = PATTERNS.map(([provider, source]) => [provider, new RegExp(source, "g")]);
  return { allowlistMatcher, patternMatchers };
}

function scanText(text, matchers) {
  const findings = [];
  const lines = text.split("\n");
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const seen = new Set();
    const record = (match, source) => {
      const key = `${match.index}:${match[0]}`;
      if (seen.has(key)) return;
      seen.add(key);
      findings.push({ line: index + 1, column: match.index + 1, match: match[0], source });
    };
    for (const match of line.matchAll(matchers.allowlistMatcher)) record(match, "allowlist");
    for (const [provider, matcher] of matchers.patternMatchers) {
      for (const match of line.matchAll(matcher)) {
        // An allowlisted ID that a naming pattern also matches is reported once, as "allowlist".
        if (!seen.has(`${match.index}:${match[0]}`)) record(match, `pattern:${provider}`);
      }
    }
  }
  return findings.sort((a, b) => a.line - b.line || a.column - b.column);
}

async function main() {
  const root = parseArguments(process.argv.slice(2));
  const files = listCandidateFiles(root);
  const matchers = buildMatchers(await loadAllowlist(root));

  let scanned = 0;
  let total = 0;
  for (const path of files.filter(isScanTarget)) {
    let buffer;
    try {
      buffer = readFileSync(join(root, path));
    } catch {
      continue; // listed by git but gone from disk (deleted, not yet staged)
    }
    if (buffer.includes(0)) continue; // binary
    scanned++;
    for (const finding of scanText(buffer.toString("utf8"), matchers)) {
      total++;
      process.stderr.write(
        `${path}:${finding.line}:${finding.column}: ${finding.match} (${finding.source})\n`,
      );
    }
  }

  if (total > 0) {
    process.stderr.write(
      `check:model-ids: ${total} model ID(s) written outside ${ALLOWLIST_PATH}. Import from the allowlist instead.\n`,
    );
    process.exit(1);
  }
  process.stdout.write(`check:model-ids: scanned ${scanned} files, 0 findings\n`);
}

main().catch((error) => {
  if (error instanceof UsageError) {
    process.stderr.write(`${error.message}\n`);
  } else if (error instanceof EnvironmentError_) {
    process.stderr.write(`check:model-ids: ${error.message}\n`);
  } else {
    process.stderr.write(`check:model-ids: unexpected error: ${error?.stack ?? error}\n`);
  }
  process.exit(2);
});
