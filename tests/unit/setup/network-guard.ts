import net from "node:net";
import { afterEach } from "vitest";

/**
 * Unit tests must not reach the network (spec 001, 3.10, ADR-5). This setup file replaces the two
 * ways a test can open a connection from Node: `net.Socket.prototype.connect` (every TCP client,
 * including `http` and `net.connect`) and `globalThis.fetch`.
 *
 * A call throws `UnmockedNetworkError` and records a violation. `afterEach` then fails the test, so a
 * test that catches and ignores the error still fails. A test that mocks the network replaces these
 * functions itself (for example with `vi.stubGlobal("fetch", ...)`) and never reaches the guard.
 *
 * Messages carry only the host and port (or the URL origin): no query, path, or headers.
 */

export interface NetworkViolation {
  readonly kind: "socket" | "fetch";
  readonly target: string;
}

class UnmockedNetworkError extends Error {
  override name = "UnmockedNetworkError";
  constructor(violation: NetworkViolation) {
    super(
      `Unmocked network access from a unit test (${violation.kind}: ${violation.target}). ` +
        "Inject a mock instead of calling the network.",
    );
  }
}

// Module-private on purpose: nothing can clear the record except the afterEach hook below.
const violations: NetworkViolation[] = [];

function record(violation: NetworkViolation): UnmockedNetworkError {
  violations.push(violation);
  return new UnmockedNetworkError(violation);
}

function socketTarget(args: readonly unknown[]): string {
  const [first, second] = args;
  if (typeof first === "number") {
    return `${typeof second === "string" ? second : "localhost"}:${first}`;
  }
  if (typeof first === "string") {
    // A string first argument is a port as a string, or a Unix socket path. Report neither value
    // beyond its kind: a path can contain user names.
    return /^\d+$/.test(first)
      ? `${typeof second === "string" ? second : "localhost"}:${first}`
      : "unix-socket";
  }
  if (typeof first === "object" && first !== null) {
    const options: { port?: unknown; host?: unknown; path?: unknown } = first;
    if (typeof options.path === "string") return "unix-socket";
    const host = typeof options.host === "string" ? options.host : "localhost";
    return `${host}:${String(options.port ?? "unknown")}`;
  }
  return "unknown";
}

function fetchTarget(input: Parameters<typeof fetch>[0]): string {
  try {
    if (typeof input === "string") return new URL(input).origin;
    if (input instanceof URL) return input.origin;
    return new URL(input.url).origin;
  } catch {
    return "unparseable-url";
  }
}

Object.defineProperty(net.Socket.prototype, "connect", {
  configurable: true,
  writable: true,
  value: (...args: unknown[]): never => {
    throw record({ kind: "socket", target: socketTarget(args) });
  },
});

const guardedFetch: typeof fetch = async (input) => {
  throw record({ kind: "fetch", target: fetchTarget(input) });
};
globalThis.fetch = guardedFetch;

afterEach(() => {
  if (violations.length === 0) return;
  const seen = violations.map((v) => `${v.kind}: ${v.target}`);
  violations.length = 0;
  const error = new Error(
    `the test made unmocked network access (${seen.join(", ")}). Inject a mock instead.`,
  );
  error.name = "UnmockedNetworkError";
  throw error;
});
