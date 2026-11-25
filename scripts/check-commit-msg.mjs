#!/usr/bin/env node
// commit-msg hook: the subject line must follow Conventional Commits (spec 001, 7.4, ADR-8).
//
// Usage: node scripts/check-commit-msg.mjs <commit-message-file>
// Exit codes: 0 accepted, 1 rejected, 2 usage error or unreadable file.
//
// Only the first line that is neither blank nor a git comment (starting with "#") is judged. Git's
// own messages are accepted as they are: merges, reverts and the fixup/squash/amend prefixes.

import { readFileSync } from "node:fs";

const USAGE = "usage: node scripts/check-commit-msg.mjs <commit-message-file>";

const TYPES = [
  "build",
  "chore",
  "ci",
  "docs",
  "feat",
  "fix",
  "perf",
  "refactor",
  "revert",
  "style",
  "test",
];

// type, optional (scope), optional !, colon, space, then a non-blank subject.
const CONVENTIONAL = new RegExp(`^(${TYPES.join("|")})(\\([^()\\s]+\\))?!?: \\S`);

// Messages that git writes by itself. They are accepted as they are.
const GIT_GENERATED = ["Merge ", 'Revert "', "fixup! ", "squash! ", "amend! "];

function subjectLine(text) {
  for (const line of text.split(/\r?\n/)) {
    if (line.trim() === "" || line.startsWith("#")) continue;
    return line;
  }
  return "";
}

function isAccepted(subject) {
  return CONVENTIONAL.test(subject) || GIT_GENERATED.some((prefix) => subject.startsWith(prefix));
}

function main(argv) {
  if (argv.length !== 1) {
    process.stderr.write(`${USAGE}\n`);
    return 2;
  }
  let text;
  try {
    text = readFileSync(argv[0], "utf8");
  } catch (error) {
    process.stderr.write(
      `check-commit-msg: cannot read ${argv[0]}: ${error instanceof Error ? error.message : error}\n`,
    );
    return 2;
  }

  const subject = subjectLine(text);
  if (isAccepted(subject)) return 0;

  process.stderr.write(
    [
      "commit rejected: the subject does not follow Conventional Commits.",
      "  expected: <type>(<scope>)?!?: <subject>",
      `  types:    ${TYPES.join(", ")}`,
      "  example: feat(parser): accept empty input",
      `  got:      ${subject === "" ? "(empty message)" : subject}`,
      "",
    ].join("\n"),
  );
  return 1;
}

process.exitCode = main(process.argv.slice(2));
