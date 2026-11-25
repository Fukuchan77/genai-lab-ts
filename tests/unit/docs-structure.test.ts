import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Structure of the written documents (spec 001, C12 "docs-structure"). Only structure is checked:
 * headings and file names, never the prose or any version number.
 */

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");

/** The five headings every Node 27 verification record carries, in this order (11.5). */
const NODE27_HEADINGS = ["結論", "検証した版", "通したゲート", "未解決事項", "再現手順"] as const;

/** The four sections every stage guide carries, in this order: read, run, modify, pass the tests (13.1). */
const STAGE_HEADINGS = ["読む", "動かす", "改造する", "テストで合格を確かめる"] as const;

/** `<n>-<slug>.md` */
const STAGE_FILE_NAME = /^\d+-[a-z0-9][a-z0-9-]*\.md$/;

/**
 * A repository path under `tests/` as written in prose: it ends on a word character, so trailing
 * punctuation (`.`, `)`, `/`) is not part of it.
 */
const TEST_PATH = /\btests\/[\w./-]*\w/g;

/** Commands the README must show: mise activation, one-step setup, and the Node 27 worktree (13.3, 11.7). */
const README_COMMANDS = ["mise activate", "mise run setup", "git worktree add"] as const;

/** `YYYY-MM-DD-<topic>.md` */
const NODE27_FILE_NAME = /^\d{4}-\d{2}-\d{2}-[a-z0-9][a-z0-9-]*\.md$/;

function listMarkdown(dir: string): string[] {
  try {
    return readdirSync(join(REPO_ROOT, dir))
      .filter((name) => name.endsWith(".md"))
      .sort();
  } catch {
    return [];
  }
}

/** Level-2 headings (`## text`) in document order, ignoring fenced code blocks. */
function level2Headings(markdown: string): string[] {
  const headings: string[] = [];
  let inFence = false;
  for (const line of markdown.split("\n")) {
    if (line.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const match = /^## (.+?)\s*$/.exec(line);
    if (match?.[1] !== undefined) headings.push(match[1]);
  }
  return headings;
}

/** Headings in `headings` that match `expected`, as indices; -1 for each that is missing. */
function headingIndices(headings: string[], expected: readonly string[]): number[] {
  return expected.map((heading) => headings.indexOf(heading));
}

describe("docs/node27 verification records (11.5)", () => {
  const files = listMarkdown("docs/node27");

  it("holds at least one record", () => {
    expect(files.length, "docs/node27/ has no .md record").toBeGreaterThanOrEqual(1);
  });

  it("names every record YYYY-MM-DD-<topic>.md", () => {
    for (const name of files) {
      expect(name, `${name} does not match YYYY-MM-DD-<topic>.md`).toMatch(NODE27_FILE_NAME);
    }
  });

  it.each(files)("%s has the five headings in order", (name) => {
    const headings = level2Headings(readFileSync(join(REPO_ROOT, "docs/node27", name), "utf8"));
    const found = headingIndices(headings, NODE27_HEADINGS);
    expect(found, `${name}: missing heading among ${NODE27_HEADINGS.join(" / ")}`).not.toContain(
      -1,
    );
    expect(found, `${name}: headings are out of order`).toEqual([...found].sort((a, b) => a - b));
  });
});

describe("docs/stages guides (13.1, 13.2)", () => {
  const files = listMarkdown("docs/stages");

  it("holds at least one guide", () => {
    expect(files.length, "docs/stages/ has no .md guide").toBeGreaterThanOrEqual(1);
  });

  it("names every guide <n>-<slug>.md", () => {
    for (const name of files) {
      expect(name, `${name} does not match <n>-<slug>.md`).toMatch(STAGE_FILE_NAME);
    }
  });

  it.each(files)("%s has the four sections in order", (name) => {
    const headings = level2Headings(readFileSync(join(REPO_ROOT, "docs/stages", name), "utf8"));
    const found = headingIndices(headings, STAGE_HEADINGS);
    expect(found, `${name}: missing section among ${STAGE_HEADINGS.join(" / ")}`).not.toContain(-1);
    expect(found, `${name}: sections are out of order`).toEqual([...found].sort((a, b) => a - b));
  });

  it.each(files)("%s links only test paths that exist", (name) => {
    const text = readFileSync(join(REPO_ROOT, "docs/stages", name), "utf8");
    const paths = [...new Set(text.match(TEST_PATH) ?? [])];
    expect(paths.length, `${name}: names no tests/ path for its pass conditions`).toBeGreaterThan(
      0,
    );
    const missing = paths.filter((path) => !existsSync(join(REPO_ROOT, path)));
    expect(missing, `${name}: names tests/ paths that do not exist`).toEqual([]);
  });
});

describe("README.md setup steps (13.3, 11.7)", () => {
  it.each(README_COMMANDS)("shows `%s`", (command) => {
    const readme = existsSync(join(REPO_ROOT, "README.md"))
      ? readFileSync(join(REPO_ROOT, "README.md"), "utf8")
      : "";
    expect(readme, `README.md does not mention \`${command}\``).toContain(command);
  });
});
