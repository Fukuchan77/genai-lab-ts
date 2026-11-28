import { readFileSync } from "node:fs";
import { join, resolve } from "node:path";
import type { FunctionDeclaration, Node, SourceFile } from "typescript/ast";
import { SyntaxKind } from "typescript/ast";
import {
  isArrayLiteralExpression,
  isBinaryExpression,
  isBindingElement,
  isCallExpression,
  isFunctionDeclaration,
  isIdentifier,
  isNumericLiteral,
  isObjectBindingPattern,
  isPropertyAccessExpression,
  isStringLiteral,
  isTypeOfExpression,
  isVariableDeclaration,
  isVariableStatement,
} from "typescript/ast/is";
import { formatSyntaxKind } from "typescript/ast/utils";
import { API } from "typescript/sync";
import { afterAll, describe, expect, it } from "vitest";
import { expectGateSuccess, resolveTool, runCommand, taskRun } from "./helpers/sandbox";

/**
 * Static checks of the `hello` task and `scripts/hello.ts` (spec 002, 5.3, 5.7, 5.8, 5.9). The script is
 * only read as text: it is never imported or run here, because it needs a local Ollama (6.8). Its
 * behavior is measured by hand and recorded in research.md R-5.
 */

const REPO_ROOT = resolve(import.meta.dirname, "..", "..");
const HELLO_COMMAND = "node --conditions=react-server scripts/hello.ts";
const SETTINGS = ["system", "prompt", "temperature", "maxOutputTokens", "maxRetries"] as const;

function readText(path: string): string {
  return readFileSync(join(REPO_ROOT, path), "utf8");
}

/** The task a run entry refers to: `{ task = "x" }` or the text `mise run x`. */
function referencedTask(entry: string | { readonly task: string }): string | undefined {
  if (typeof entry !== "string") return entry.task;
  return /^mise run (\S+)$/.exec(entry.trim())?.[1];
}

/** Every task reached from `name` through references, and the leaf commands on the way. */
function reach(name: string, tasks = new Set<string>(), commands: string[] = []) {
  for (const entry of taskRun(name)) {
    const reference = referencedTask(entry);
    if (reference !== undefined) {
      if (!tasks.has(reference)) {
        tasks.add(reference);
        reach(reference, tasks, commands);
      }
    } else if (typeof entry === "string") {
      commands.push(entry);
    }
  }
  return { tasks, commands };
}

/** Tracked and untracked (not ignored) files of the repository. */
function repositoryFiles(): string[] {
  const result = runCommand([
    resolveTool("git"),
    "ls-files",
    "--cached",
    "--others",
    "--exclude-standard",
    "-z",
  ]);
  expectGateSuccess(result);
  return result.stdout.split("\0").filter((file) => file !== "");
}

// The explain() check parses scripts/hello.ts with the TypeScript compiler API that the `typescript` package
// already ships (`typescript/sync`: it starts the native compiler as a child process and talks to it over a
// pipe, so it needs neither the network nor a new dependency). The script itself is never imported or run (6.8).
let sharedApi: API | undefined;
let sourceCount = 0;

afterAll(() => {
  sharedApi?.close();
});

/** Parses `source` and hands its syntax tree to `use`. The tree is only valid while `use` runs. */
function withSourceFile<T>(source: string, use: (file: SourceFile) => T): T {
  sharedApi ??= new API({ cwd: REPO_ROOT });
  sourceCount += 1;
  using lease = sharedApi.createSourceFile(`/virtual/explain-${sourceCount}.ts`, source);
  return use(lease.sourceFile);
}

function* walk(node: Node): Generator<Node> {
  yield node;
  for (const child of node.childrenIter()) yield* walk(child);
}

/** Node objects can be created again on each access, so two nodes are the same when they cover the same text. */
function sameNode(a: Node | undefined, b: Node | undefined): boolean {
  return (
    a !== undefined && b !== undefined && a.kind === b.kind && a.pos === b.pos && a.end === b.end
  );
}

/** The text of a string-like literal, or undefined for any other node. */
function literalText(node: Node): string | undefined {
  const kinds: SyntaxKind[] = [
    SyntaxKind.StringLiteral,
    SyntaxKind.NoSubstitutionTemplateLiteral,
    SyntaxKind.TemplateHead,
    SyntaxKind.TemplateMiddle,
    SyntaxKind.TemplateTail,
  ];
  return kinds.includes(node.kind) && "text" in node && typeof node.text === "string"
    ? node.text
    : undefined;
}

// What explain() may be made of (spec 002, 5.6, 5.7). It may build text from names, counts, and the HTTP status.
// The set is closed: a construct that is not listed is a leak until someone adds it on purpose and reviews it.
const EXPLAIN_KINDS = new Set<SyntaxKind>([
  SyntaxKind.Block,
  SyntaxKind.IfStatement,
  SyntaxKind.ReturnStatement,
  SyntaxKind.VariableStatement,
  SyntaxKind.VariableDeclarationList,
  SyntaxKind.VariableDeclaration,
  SyntaxKind.ObjectBindingPattern,
  SyntaxKind.BindingElement,
  SyntaxKind.Identifier,
  SyntaxKind.PropertyAccessExpression,
  SyntaxKind.CallExpression,
  SyntaxKind.ArrayLiteralExpression,
  SyntaxKind.BinaryExpression,
  SyntaxKind.ConditionalExpression,
  SyntaxKind.TypeOfExpression,
  SyntaxKind.ParenthesizedExpression,
  SyntaxKind.StringLiteral,
  SyntaxKind.NumericLiteral,
  SyntaxKind.NoSubstitutionTemplateLiteral,
  SyntaxKind.TemplateExpression,
  SyntaxKind.TemplateHead,
  SyntaxKind.TemplateMiddle,
  SyntaxKind.TemplateTail,
  SyntaxKind.TemplateSpan,
  // operators: `instanceof`, `&&`, `||`, `===`, `!==`, and the two tokens of `a ? b : c`
  SyntaxKind.InstanceOfKeyword,
  SyntaxKind.AmpersandAmpersandToken,
  SyntaxKind.BarBarToken,
  SyntaxKind.EqualsEqualsEqualsToken,
  SyntaxKind.ExclamationEqualsEqualsToken,
  SyntaxKind.QuestionToken,
  SyntaxKind.ColonToken,
]);
/** Names that explain() may read without declaring them: the error, the classes it asks about, and a fixed text. */
const EXPLAIN_FREE_NAMES = new Set([
  "error",
  "CallFailedError",
  "CallConfigError",
  "APICallError",
  "Error",
  "PULL_COMMAND",
  "undefined",
]);
/** What may be read from an error: types, counts, the failing setting, and the HTTP status. */
const EXPLAIN_PROPERTIES = new Set([
  "cause",
  "name",
  "statusCode",
  "reason",
  "attempts",
  "field",
  "join",
]);
/** What may be read from `error.cause`: its type name and its HTTP status. */
const CAUSE_PROPERTIES = new Set(["name", "statusCode"]);

function kindReason(kind: SyntaxKind): string {
  return `node kind not allowed: ${formatSyntaxKind(kind)}`;
}

/** The property a binding element reads: `{ a }` reads `a`, and `{ a: b }` reads `a`. */
function bindingProperty(element: Node): string {
  if (!isBindingElement(element)) return "";
  const source = element.propertyName ?? element.name;
  return source !== undefined && isIdentifier(source) ? source.text : "";
}

/** The text of the module-level PROMPT and SYSTEM constants, which must never be copied into an output. */
function protectedTexts(file: SourceFile): string[] {
  const texts: string[] = [];
  for (const statement of file.statements) {
    if (!isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      const text = declaration.initializer ? literalText(declaration.initializer) : undefined;
      const name = isIdentifier(declaration.name) ? declaration.name.text : "";
      if ((name === "PROMPT" || name === "SYSTEM") && text !== undefined && text !== "") {
        texts.push(text);
      }
    }
  }
  return texts;
}

/** `error.cause` may only be narrowed, or asked for its name or status. Anything else could print its message. */
function causeUseIsAllowed(access: Node): boolean {
  const parent = access.parent;
  if (isPropertyAccessExpression(parent)) {
    return sameNode(parent.expression, access) && CAUSE_PROPERTIES.has(parent.name.text);
  }
  if (isBinaryExpression(parent)) {
    return (
      parent.operatorToken.kind === SyntaxKind.InstanceOfKeyword && sameNode(parent.left, access)
    );
  }
  if (isTypeOfExpression(parent)) return true;
  if (isVariableDeclaration(parent) && isObjectBindingPattern(parent.name)) {
    return (
      sameNode(parent.initializer, access) &&
      parent.name.elements.every((element) => CAUSE_PROPERTIES.has(bindingProperty(element)))
    );
  }
  return false;
}

/** `error` itself may only be narrowed, or asked for one of the allowed properties. */
function errorUseIsAllowed(identifier: Node): boolean {
  const parent = identifier.parent;
  if (isPropertyAccessExpression(parent)) return sameNode(parent.expression, identifier);
  if (isTypeOfExpression(parent)) return true;
  return (
    isBinaryExpression(parent) &&
    parent.operatorToken.kind === SyntaxKind.InstanceOfKeyword &&
    sameNode(parent.left, identifier)
  );
}

/** Checks one node of explain(); `locals` are the names that explain() declares itself. */
function checkExplainNode(node: Node, locals: ReadonlySet<string>, leaks: Set<string>): void {
  if (!EXPLAIN_KINDS.has(node.kind)) leaks.add(kindReason(node.kind));

  if (isBindingElement(node)) {
    const property = bindingProperty(node);
    if (!EXPLAIN_PROPERTIES.has(property)) leaks.add(`property not allowed: ${property}`);
  }
  if (isPropertyAccessExpression(node)) {
    const property = node.name.text;
    if (!EXPLAIN_PROPERTIES.has(property)) leaks.add(`property not allowed: ${property}`);
    if (property === "cause") {
      if (!(isIdentifier(node.expression) && node.expression.text === "error")) {
        leaks.add("cause not read from error");
      }
      if (!causeUseIsAllowed(node)) leaks.add("error.cause used as a value");
    }
  }
  if (isCallExpression(node)) {
    const callee = node.expression;
    const isJoin =
      isPropertyAccessExpression(callee) &&
      callee.name.text === "join" &&
      isArrayLiteralExpression(callee.expression) &&
      node.arguments.every((argument) => isStringLiteral(argument));
    if (!isJoin) leaks.add("call not allowed");
  }
  if (isIdentifier(node)) {
    const parent = node.parent;
    // A property name, or the name that a declaration introduces: checked where they are used or read.
    if (isPropertyAccessExpression(parent) && sameNode(parent.name, node)) return;
    if (isVariableDeclaration(parent) && sameNode(parent.name, node)) return;
    if (isBindingElement(parent)) return;
    if (node.text === "error") {
      if (!errorUseIsAllowed(node)) leaks.add("error used as a value");
    } else if (!EXPLAIN_FREE_NAMES.has(node.text) && !locals.has(node.text)) {
      leaks.add(`name not allowed: ${node.text}`);
    }
  }
}

/** The name that a property access reads, or a declaration or a binding introduces: not a use of a variable. */
function isNamePosition(node: Node): boolean {
  const parent = node.parent;
  return (
    (isPropertyAccessExpression(parent) && sameNode(parent.name, node)) ||
    (isVariableDeclaration(parent) && sameNode(parent.name, node)) ||
    isBindingElement(parent)
  );
}

// What `console.log` may print (spec 002, 5.1): the model ID, the reply, and the two token counts.
const LOG_KINDS = new Set<SyntaxKind>([
  SyntaxKind.TemplateExpression,
  SyntaxKind.TemplateHead,
  SyntaxKind.TemplateMiddle,
  SyntaxKind.TemplateTail,
  SyntaxKind.TemplateSpan,
  SyntaxKind.NoSubstitutionTemplateLiteral,
  SyntaxKind.StringLiteral,
  SyntaxKind.Identifier,
  SyntaxKind.PropertyAccessExpression,
  SyntaxKind.BinaryExpression,
  SyntaxKind.QuestionQuestionToken,
]);
const LOG_NAMES = new Set(["MODEL_ID", "result"]);
const LOG_PROPERTIES = new Set(["text", "usage", "inputTokens", "outputTokens"]);
/** Ways to reach an output or run text that this check cannot follow: they are refused, not analyzed. */
const ESCAPE_NAMES = new Set(["globalThis", "eval", "Function", "require", "fetch", "Buffer"]);

function logPartIsAllowed(part: Node): boolean {
  if (!LOG_KINDS.has(part.kind)) return false;
  if (isBinaryExpression(part)) return part.operatorToken.kind === SyntaxKind.QuestionQuestionToken;
  if (!isIdentifier(part)) return true;
  const parent = part.parent;
  if (isPropertyAccessExpression(parent) && sameNode(parent.name, part)) {
    return LOG_PROPERTIES.has(part.text);
  }
  return LOG_NAMES.has(part.text);
}

/** Whether `node` is inside the declaration `function explain(...) { ... }`. */
function isInsideExplain(node: Node): boolean {
  for (
    let current: Node | undefined = node.parent;
    current !== undefined;
    current = current.parent
  ) {
    if (isFunctionDeclaration(current) && current.name?.text === "explain") return true;
  }
  return false;
}

/** The caught error may only be handed to `explain(error)`: Node prints an error that escapes, message and cause too. */
function errorEscapes(node: Node): boolean {
  const call = node.parent;
  const handedToExplain =
    isCallExpression(call) &&
    isIdentifier(call.expression) &&
    call.expression.text === "explain" &&
    call.arguments.length === 1 &&
    sameNode(call.arguments[0], node);
  return !handedToExplain && !isInsideExplain(node);
}

/**
 * Every way the script can print or end: `console` only as `console.log(...)` or `console.error(explain(error))`
 * in a statement, `process` only as `process.exitCode = n`, no `throw` (Node prints an uncaught error with its
 * message), no dynamic `import()`, and none of the names in ESCAPE_NAMES.
 */
function outputLeaks(file: SourceFile, leaks: Set<string>): void {
  let errorCalls = 0;
  for (const node of walk(file)) {
    if (node.kind === SyntaxKind.ThrowStatement) leaks.add("throw in the script");
    if (isCallExpression(node) && node.expression.kind === SyntaxKind.ImportKeyword) {
      leaks.add("dynamic import");
    }
    if (!isIdentifier(node) || isNamePosition(node)) continue;
    if (ESCAPE_NAMES.has(node.text)) leaks.add(`global escape hatch: ${node.text}`);
    if (node.text === "error" && errorEscapes(node)) leaks.add("error used outside explain(error)");

    if (node.text === "process") {
      const access = node.parent;
      const assignment = access.parent;
      const allowed =
        isPropertyAccessExpression(access) &&
        sameNode(access.expression, node) &&
        access.name.text === "exitCode" &&
        isBinaryExpression(assignment) &&
        assignment.operatorToken.kind === SyntaxKind.EqualsToken &&
        sameNode(assignment.left, access) &&
        isNumericLiteral(assignment.right);
      if (!allowed) leaks.add("process used other than process.exitCode = n");
    }

    if (node.text !== "console") continue;
    const access = node.parent;
    const call = access.parent;
    if (
      !(
        isPropertyAccessExpression(access) &&
        sameNode(access.expression, node) &&
        access.questionDotToken === undefined &&
        isCallExpression(call) &&
        sameNode(call.expression, access) &&
        call.questionDotToken === undefined &&
        call.parent.kind === SyntaxKind.ExpressionStatement &&
        (access.name.text === "log" || access.name.text === "error")
      )
    ) {
      leaks.add("console used in a form the check cannot read");
      continue;
    }
    if (access.name.text === "error") {
      errorCalls += 1;
      const argument = call.arguments[0];
      const printsOnlyExplain =
        call.arguments.length === 1 &&
        argument !== undefined &&
        isCallExpression(argument) &&
        isIdentifier(argument.expression) &&
        argument.expression.text === "explain" &&
        argument.arguments.length === 1 &&
        argument.arguments.every((item) => isIdentifier(item) && item.text === "error");
      if (!printsOnlyExplain) leaks.add("console.error prints more than explain(error)");
    } else {
      for (const argument of call.arguments) {
        for (const part of walk(argument)) {
          if (!logPartIsAllowed(part)) {
            leaks.add(
              "console.log prints something other than the model, the reply, and the usage",
            );
          }
        }
      }
    }
  }
  if (errorCalls !== 1) leaks.add("expected exactly one console.error");
}

// Module-level constants that explain() reads by name. Each is checked where it is defined, so that a value
// cannot be hidden behind a name that explain() is allowed to use.
const CONSTANT_KINDS = new Set<SyntaxKind>([
  SyntaxKind.TemplateExpression,
  SyntaxKind.TemplateHead,
  SyntaxKind.TemplateMiddle,
  SyntaxKind.TemplateTail,
  SyntaxKind.TemplateSpan,
  SyntaxKind.NoSubstitutionTemplateLiteral,
  SyntaxKind.StringLiteral,
  SyntaxKind.NumericLiteral,
  SyntaxKind.Identifier,
  SyntaxKind.PropertyAccessExpression,
  SyntaxKind.ElementAccessExpression,
]);
const SAFE_CONSTANTS: Readonly<Record<string, readonly string[]>> = {
  PULL_COMMAND: ["MODEL_ID"],
  MODEL_ID: ["MODEL_ALLOWLIST"],
};

function constantLeaks(file: SourceFile, leaks: Set<string>): void {
  for (const [name, allowed] of Object.entries(SAFE_CONSTANTS)) {
    const declarations = file.statements
      .filter(isVariableStatement)
      .flatMap((statement) => [...statement.declarationList.declarations])
      .filter((declaration) => isIdentifier(declaration.name) && declaration.name.text === name);
    const initializer = declarations[0]?.initializer;
    if (declarations.length !== 1 || initializer === undefined) {
      leaks.add(`constant not found: ${name}`);
      continue;
    }
    for (const part of walk(initializer)) {
      const badKind = !CONSTANT_KINDS.has(part.kind);
      const badName =
        isIdentifier(part) &&
        !(isPropertyAccessExpression(part.parent) && sameNode(part.parent.name, part)) &&
        !allowed.includes(part.text);
      if (badKind || badName) leaks.add(`constant not safe: ${name}`);
    }
  }
}

/**
 * Lists the ways `source` could print more than names, counts, and the HTTP status, or copy the prompt or the
 * system text into an output. The check reads the syntax tree, so a regular expression, a template, a comment,
 * an escape, or a renamed local cannot hide code from it. It proves what explain() can reference, not what it
 * prints; the real output is measured by hand (research.md R-5).
 */
function explainLeaks(source: string): string[] {
  return withSourceFile(source, (file) => {
    const leaks = new Set<string>();

    const protectedValues = protectedTexts(file);
    if (protectedValues.length !== 2) leaks.add("PROMPT and SYSTEM constants not found");
    for (const node of walk(file)) {
      const text = literalText(node);
      if (text === undefined) continue;
      const declaration = node.parent;
      if (isVariableDeclaration(declaration) && sameNode(declaration.initializer, node)) {
        const name = isIdentifier(declaration.name) ? declaration.name.text : "";
        if (name === "PROMPT" || name === "SYSTEM") continue;
      }
      // Either direction: the whole text, or a piece of it that is long enough to mean something.
      if (protectedValues.some((v) => text.includes(v) || (text.length >= 8 && v.includes(text)))) {
        leaks.add("string copies the prompt or system text");
      }
    }

    // `[...].join(separator)` over string pieces builds one text: check the joined text, not each piece.
    for (const node of walk(file)) {
      if (!isCallExpression(node) || !isPropertyAccessExpression(node.expression)) continue;
      const { expression: list, name } = node.expression;
      if (name.text !== "join" || !isArrayLiteralExpression(list)) continue;
      const separator = node.arguments[0];
      const separatorText = separator === undefined ? "," : (literalText(separator) ?? "\u0000");
      const joined = list.elements
        .map((element) => literalText(element) ?? "\u0000")
        .join(separatorText);
      if (protectedValues.some((value) => joined.includes(value))) {
        leaks.add("string copies the prompt or system text");
      }
    }

    outputLeaks(file, leaks);
    constantLeaks(file, leaks);

    const explain = file.statements.find(
      (statement): statement is FunctionDeclaration =>
        isFunctionDeclaration(statement) && statement.name?.text === "explain",
    );
    if (explain?.body === undefined) {
      leaks.add("explain() not found");
      return [...leaks];
    }
    const parameter = explain.parameters[0];
    const parameterName =
      parameter !== undefined && isIdentifier(parameter.name) ? parameter.name.text : undefined;
    if (explain.parameters.length !== 1 || parameterName !== "error") {
      leaks.add("explain() must take exactly one parameter named error");
    }

    const locals = new Set<string>();
    for (const node of walk(explain.body)) {
      if (!isVariableDeclaration(node)) continue;
      if (isIdentifier(node.name)) locals.add(node.name.text);
      if (isObjectBindingPattern(node.name)) {
        for (const element of node.name.elements) {
          if (element.name !== undefined && isIdentifier(element.name))
            locals.add(element.name.text);
        }
      }
    }
    for (const node of walk(explain.body)) checkExplainNode(node, locals, leaks);
    return [...leaks];
  });
}

// Child processes run mise and git (spec 001 convention).
describe("hello task", { timeout: 120_000 }, () => {
  it("is one command, `node --conditions=react-server scripts/hello.ts` (5.8)", () => {
    expect(taskRun("hello")).toEqual([HELLO_COMMAND]);
  });

  it("has a description (5.8)", () => {
    const result = runCommand([resolveTool("mise"), "tasks", "ls", "--json"]);
    expectGateSuccess(result);
    const tasks: unknown = JSON.parse(result.stdout);
    if (!Array.isArray(tasks)) throw new Error("mise tasks ls --json: expected an array");
    const hello = tasks.find(
      (task): task is { description?: unknown } =>
        typeof task === "object" && task !== null && "name" in task && task.name === "hello",
    );
    expect(typeof hello?.description === "string" && hello.description.trim() !== "").toBe(true);
  });

  it.each(["verify", "security"])("is not reached from the %s task (5.9)", (name) => {
    const { tasks, commands } = reach(name);

    expect([...tasks]).not.toContain("hello");
    for (const command of commands) {
      expect(command, `${name} runs "${command}"`).not.toContain("hello");
    }
  });

  it("is not referenced by the git hooks or the CI workflows (5.9)", () => {
    const files = repositoryFiles().filter(
      (file) => file === "lefthook.yml" || /^\.github\/workflows\/[^/]+\.ya?ml$/.test(file),
    );
    expect(files, "lefthook.yml and the workflows must be found").toContain("lefthook.yml");
    expect(files.length).toBeGreaterThan(1);

    for (const file of files) {
      const text = readText(file);
      expect(text, `${file} mentions the hello task`).not.toMatch(/mise run hello/);
      expect(text, `${file} mentions the hello script`).not.toContain("scripts/hello");
    }
  });
});

describe("scripts/hello.ts, read as text only (5.3, 5.7, 6.8)", () => {
  /** The source without comments, so that a word in a comment cannot satisfy or break a check. */
  const code = () =>
    readText("scripts/hello.ts")
      .replace(/\/\*[\s\S]*?\*\//g, "")
      .replace(/(^|[^:"'`])\/\/.*$/gm, "$1");

  it("does not read environment variables (5.7)", () => {
    expect(code()).not.toContain("process.env");
    expect(code()).not.toContain("import.meta.env");
  });

  it("calls callModel in exactly one place, with all five settings written out (5.3)", () => {
    const text = code();
    const calls = [...text.matchAll(/\bcallModel\(/g)];
    expect(calls, "callModel( must appear once, outside comments").toHaveLength(1);

    // The argument list: from the opening parenthesis to its matching closing parenthesis.
    const open = (calls[0]?.index ?? 0) + "callModel".length;
    let depth = 0;
    let end = open;
    for (let index = open; index < text.length; index += 1) {
      if (text[index] === "(") depth += 1;
      if (text[index] === ")") depth -= 1;
      if (depth === 0) {
        end = index;
        break;
      }
    }
    const args = text.slice(open, end + 1);
    for (const setting of SETTINGS) {
      expect(args, `the callModel( arguments must name ${setting}`).toMatch(
        new RegExp(`\\b${setting}\\b`),
      );
    }
  });

  it("never reads the message of an error to decide what to print (5.6)", () => {
    expect(code()).not.toMatch(/\.message\b/);
  });

  it("explain() and every output are made only of allowed values, and none copies the prompt (5.6, 5.7)", () => {
    expect(explainLeaks(readText("scripts/hello.ts"))).toEqual([]);
  });
});

const STANDARD_CONSTANTS = [
  "const MODEL_ID = MODEL_ALLOWLIST.ollama[0];",
  "const PULL_COMMAND = `ollama pull #{MODEL_ID}`;",
].join("\n");
const STANDARD_TAIL = [
  "try {",
  "  const result = await callModel(model, { prompt: PROMPT });",
  "  console.log(`model: #{MODEL_ID}`);",
  "  console.log(`reply: #{result.text}`);",
  '  console.log(`inputTokens: #{result.usage.inputTokens ?? "unknown"}`);',
  "} catch (error) {",
  "  console.error(explain(error));",
  "  process.exitCode = 1;",
  "}",
].join("\n");

/** A script around `body`. The snippets write `#{` for a template placeholder, so the linter sees no `${`. */
function explainSource(
  body: string,
  parts: { header?: string; constants?: string; tail?: string } = {},
): string {
  return [
    parts.header ?? "",
    'const PROMPT = "Say hello in one short sentence.";',
    'const SYSTEM = "You are a concise assistant.";',
    parts.constants ?? STANDARD_CONSTANTS,
    "function explain(error: unknown): string {",
    body,
    "}",
    parts.tail ?? STANDARD_TAIL,
  ]
    .join("\n")
    .replaceAll("#{", "${");
}

// The check above reads the syntax tree. These bodies are what it must refuse, each for its own named reason: every
// one could print the message, the request body, or the prompt of a provider error. Without the reasons, a rule
// could be deleted and the snippet would still fail for another one.
describe("the explain() check refuses leaks (5.7, 6.7)", () => {
  it.each([
    ["String(error.cause)", "return String(error.cause);", "name not allowed: String"],
    [
      "JSON.stringify(error.cause)",
      "return JSON.stringify(error.cause);",
      "name not allowed: JSON",
    ],
    ["a call that is not join", "return String(error.name);", "call not allowed"],
    ["a template with error.cause", "return `#{error.cause}`;", "error.cause used as a value"],
    [
      "a local that keeps error.cause",
      "const detail = error.cause;",
      "error.cause used as a value",
    ],
    ["error.cause plus text", 'return error.cause + "";', kindReason(SyntaxKind.PlusToken)],
    ["error.cause.message", "return error.cause.message;", "property not allowed: message"],
    ["error.cause.toString()", "return error.cause.toString();", "property not allowed: toString"],
    ["error.stack", "return error.stack;", "property not allowed: stack"],
    [
      "the response body in a template",
      "return `#{error.cause.responseBody}`;",
      "property not allowed: responseBody",
    ],
    [
      "the request body of the cause",
      "return error.cause.requestBodyValues.prompt;",
      "property not allowed: requestBodyValues",
    ],
    [
      "the message taken by destructuring",
      "const { message } = error.cause;",
      "property not allowed: message",
    ],
    [
      "the message taken by destructuring under another name",
      "const { message: detail } = error.cause;",
      "property not allowed: message",
    ],
    [
      "a property read by index",
      "return error['cause'];",
      kindReason(SyntaxKind.ElementAccessExpression),
    ],
    [
      "a property read by index after a space",
      'return error ["cause"];',
      kindReason(SyntaxKind.ElementAccessExpression),
    ],
    [
      "a computed name in a pattern",
      "const { [key]: detail } = error.cause;",
      kindReason(SyntaxKind.ComputedPropertyName),
    ],
    ["optional chaining", "return error?.cause?.name;", kindReason(SyntaxKind.QuestionDotToken)],
    [
      "a spread of the cause",
      'return [...error.cause].join("");',
      kindReason(SyntaxKind.SpreadElement),
    ],
    ["the error itself in a list", 'return ["x", error].join(" ");', "error used as a value"],
    ["the error itself in a template", "return `#{error}`;", "error used as a value"],
    ["the error returned", "return error;", "error used as a value"],
    ["a new object", "return new String(error.name);", kindReason(SyntaxKind.NewExpression)],
    [
      "a function that reads the cause",
      "const f = () => error.cause; return f();",
      kindReason(SyntaxKind.ArrowFunction),
    ],
    [
      "a tagged template",
      "return tag`#{error.name}`;",
      kindReason(SyntaxKind.TaggedTemplateExpression),
    ],
    ["this", "return this;", kindReason(SyntaxKind.ThisKeyword)],
    [
      "the prompt in a local",
      "const detail = PROMPT; return `#{detail}`;",
      "name not allowed: PROMPT",
    ],
    ["the system text", "return SYSTEM;", "name not allowed: SYSTEM"],
    // The bypasses that the reviewer from another model family found in the first two versions of this check.
    [
      "a regular expression with a brace, then the message by index",
      'if (/}/.test("}") && error.cause instanceof Error) return error.cause["message"];',
      kindReason(SyntaxKind.RegularExpressionLiteral),
    ],
    [
      "the prompt written out as a literal",
      'return "Say hello in one short sentence.";',
      "string copies the prompt or system text",
    ],
    [
      "the prompt written out in a template",
      "return `Say hello in one short sentence.`;",
      "string copies the prompt or system text",
    ],
    [
      "the prompt inside a longer text",
      "return `Failed: #{error.name} Say hello in one short sentence.`;",
      "string copies the prompt or system text",
    ],
    [
      "the prompt split into short pieces and joined back",
      'return ["Say ", "hello ", "in one ", "short ", "sent", "ence."].join("");',
      "string copies the prompt or system text",
    ],
    [
      "the prompt split into words and joined with spaces",
      'return ["Say", "hello", "in", "one", "short", "sentence."].join(" ");',
      "string copies the prompt or system text",
    ],
    [
      "a piece of the system text",
      'return "a concise assistant";',
      "string copies the prompt or system text",
    ],
    [
      "braces in a string, a template, a regular expression, and a comment, then the prompt",
      [
        "if (error instanceof CallFailedError) {",
        "  const a = `}`;",
        '  const b = "}"; // }',
        "  /* } */",
        '  const c = /}/.test("}");',
        "}",
        "return PROMPT;",
      ].join("\n"),
      "name not allowed: PROMPT",
    ],
  ])("%s", (_name, body, reason) => {
    expect(explainLeaks(explainSource(body))).toContain(reason);
  });

  it.each([
    [
      "PULL_COMMAND built from PROMPT (round 4)",
      {
        constants:
          'const MODEL_ID = MODEL_ALLOWLIST.ollama[0];\nconst PULL_COMMAND = "ollama pull " + PROMPT;',
      },
      "constant not safe: PULL_COMMAND",
    ],
    [
      "PULL_COMMAND built from SYSTEM in a template",
      {
        constants:
          "const MODEL_ID = MODEL_ALLOWLIST.ollama[0];\nconst PULL_COMMAND = `x #{SYSTEM}`;",
      },
      "constant not safe: PULL_COMMAND",
    ],
    [
      "PULL_COMMAND built by a call",
      {
        constants:
          "const MODEL_ID = MODEL_ALLOWLIST.ollama[0];\nconst PULL_COMMAND = String(PROMPT);",
      },
      "constant not safe: PULL_COMMAND",
    ],
    [
      "MODEL_ID taken from PROMPT",
      { constants: "const MODEL_ID = PROMPT;\nconst PULL_COMMAND = `ollama pull #{MODEL_ID}`;" },
      "constant not safe: MODEL_ID",
    ],
    [
      "PULL_COMMAND missing",
      { constants: "const MODEL_ID = MODEL_ALLOWLIST.ollama[0];" },
      "constant not found: PULL_COMMAND",
    ],
    [
      "optional-chained console.error with the cause (round 4)",
      { tail: "try {} catch (error) { console?.error(error.cause); }" },
      "console used in a form the check cannot read",
    ],
    [
      "console['error'] with the error (round 4)",
      { tail: 'try {} catch (error) { console["error"](error); }' },
      "console used in a form the check cannot read",
    ],
    [
      "the error handed to Promise.reject (round 7)",
      {
        tail: "try {} catch (error) { console.error(explain(error)); await Promise.reject(error); }",
      },
      "error used outside explain(error)",
    ],
    [
      "the error stored for later",
      { tail: "try {} catch (error) { console.error(explain(error)); const kept = error; }" },
      "error used outside explain(error)",
    ],
    [
      "the cause read outside explain",
      { tail: "try {} catch (error) { console.error(explain(error)); const c = error.cause; }" },
      "error used outside explain(error)",
    ],
    [
      "console.debug with the prompt (round 7)",
      { tail: "console.debug(PROMPT);\ntry {} catch (error) { console.error(explain(error)); }" },
      "console used in a form the check cannot read",
    ],
    [
      "console.warn with the error",
      { tail: "try {} catch (error) { console.warn(error); console.error(explain(error)); }" },
      "console used in a form the check cannot read",
    ],
    [
      "console.error with the cause",
      { tail: "try {} catch (error) { console.error(error.cause); }" },
      "console.error prints more than explain(error)",
    ],
    [
      "console.error with the prompt added",
      { tail: "try {} catch (error) { console.error(explain(error), PROMPT); }" },
      "console.error prints more than explain(error)",
    ],
    [
      "console.log with the prompt",
      { tail: "console.log(PROMPT);\ntry {} catch (error) { console.error(explain(error)); }" },
      "console.log prints something other than the model, the reply, and the usage",
    ],
    [
      "console.log with the error",
      { tail: "console.log(error);\ntry {} catch (error) { console.error(explain(error)); }" },
      "console.log prints something other than the model, the reply, and the usage",
    ],
    [
      "console.log through a call",
      {
        tail: "console.log(String(PROMPT));\ntry {} catch (error) { console.error(explain(error)); }",
      },
      "console.log prints something other than the model, the reply, and the usage",
    ],
    [
      "console passed around as a value",
      { tail: "const c = console;\ntry {} catch (error) { console.error(explain(error)); }" },
      "console used in a form the check cannot read",
    ],
    [
      "console.error called twice",
      {
        tail: "try {} catch (error) { console.error(explain(error)); console.error(explain(error)); }",
      },
      "expected exactly one console.error",
    ],
    [
      "console.error never called",
      { tail: "try {} catch (error) { process.exitCode = 1; }" },
      "expected exactly one console.error",
    ],
    [
      "process.stderr.write with the cause",
      {
        tail: "try {} catch (error) { console.error(explain(error)); process.stderr.write(String(error.cause)); }",
      },
      "process used other than process.exitCode = n",
    ],
    [
      "process.exitCode set from a value",
      {
        tail: "try {} catch (error) { console.error(explain(error)); process.exitCode = error.cause; }",
      },
      "process used other than process.exitCode = n",
    ],
    [
      "a rethrow",
      { tail: "try {} catch (error) { console.error(explain(error)); throw error; }" },
      "throw in the script",
    ],
    [
      "a dynamic import",
      { tail: "try {} catch (error) { console.error(explain(error)); import('node:fs'); }" },
      "dynamic import",
    ],
    [
      "globalThis",
      {
        tail: "try {} catch (error) { console.error(explain(error)); globalThis.console.log(error); }",
      },
      "global escape hatch: globalThis",
    ],
  ])("refuses a script-level leak: %s", (_name, parts, reason) => {
    const leaks = explainLeaks(explainSource("return error.name;", parts));
    expect(leaks, `leaks found: ${JSON.stringify(leaks)}`).toContain(reason);
  });

  it("refuses a copy of the prompt anywhere in the file, such as a console call", () => {
    const source = explainSource("return error.name;", {
      header: 'console.log("Say hello in one short sentence.");',
    });
    expect(explainLeaks(source)).toContain("string copies the prompt or system text");
  });

  it("refuses a source in which it cannot find what it checks", () => {
    const leaks = explainLeaks("const x = 1;");
    expect(leaks).toContain("PROMPT and SYSTEM constants not found");
    expect(leaks).toContain("explain() not found");
    expect(leaks).toContain("constant not found: PULL_COMMAND");
    expect(leaks).toContain("expected exactly one console.error");
    expect(
      explainLeaks(explainSource("return error.name;").replace("(error:", "(problem:")),
    ).toContain("explain() must take exactly one parameter named error");
  });

  it("accepts the shape of the real function, and a rename of its locals (control)", () => {
    const safe = (detail: string) =>
      [
        "if (error instanceof CallFailedError && error.cause instanceof APICallError) {",
        "  const { statusCode } = error.cause;",
        "  if (statusCode === undefined) return `Could not connect.\\n  #{PULL_COMMAND}`;",
        '  if (statusCode === 404) return ["Pull it:", `  #{PULL_COMMAND}`].join("\\n");',
        "}",
        `const ${detail} = error.cause instanceof Error ? error.cause.name : typeof error.cause;`,
        `return \`The call failed (#{error.reason} after #{error.attempts} attempt(s)): #{${detail}}\`;`,
      ].join("\n");
    expect(explainLeaks(explainSource(safe("detail")))).toEqual([]);
    expect(explainLeaks(explainSource(safe("summary")))).toEqual([]);
  });
});
