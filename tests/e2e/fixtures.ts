import { test as base, expect } from "@playwright/test";

/**
 * E2E tests import `test` and `expect` from this file, never from @playwright/test directly
 * (enforced by Biome's noRestrictedImports; spec 001, 3.11, ADR-5).
 *
 * The auto fixture `networkGuard` routes every request of the browser context. A request to any
 * origin other than `baseURL` is aborted and recorded, and the test fails in teardown. A test that
 * mocks a request with `page.route` is served before this context-level route, so mocked traffic
 * never reaches the guard. Without a `baseURL` there is no allowed origin and everything is blocked.
 * `data:` and `blob:` URLs are not network requests and are left alone.
 */

export interface ExternalRequestViolation {
  readonly method: string;
  readonly url: string;
}

interface GuardFixtures {
  /** The recorded violations. The guard owns the array; tests only read it. */
  blockedRequests: readonly ExternalRequestViolation[];
  networkGuard: ExternalRequestViolation[];
}

interface GuardOptions {
  /** `false` only for the self-check that asserts on `blockedRequests` itself. */
  failOnBlockedRequest: boolean;
}

function originOf(url: string): string | undefined {
  try {
    return new URL(url).origin;
  } catch {
    return undefined;
  }
}

export const test = base.extend<GuardFixtures & GuardOptions>({
  failOnBlockedRequest: [true, { option: true }],

  networkGuard: [
    async ({ context, baseURL, failOnBlockedRequest }, provide) => {
      const violations: ExternalRequestViolation[] = [];
      const allowedOrigin = baseURL === undefined ? undefined : originOf(baseURL);

      await context.route("**/*", async (route) => {
        const request = route.request();
        const url = request.url();
        if (url.startsWith("data:") || url.startsWith("blob:")) {
          await route.fallback();
          return;
        }
        if (allowedOrigin !== undefined && originOf(url) === allowedOrigin) {
          await route.fallback();
          return;
        }
        violations.push({ method: request.method(), url });
        await route.abort("blockedbyclient");
      });

      await provide(violations);

      if (failOnBlockedRequest && violations.length > 0) {
        // Origins only: a URL's path and query can carry tokens or personal data.
        const origins = [...new Set(violations.map((v) => originOf(v.url) ?? "unparseable-url"))];
        throw new Error(
          `the test requested ${violations.length} external origin(s) without a mock: ${origins.join(", ")}. ` +
            "Mock the request with page.route instead.",
        );
      }
    },
    { auto: true },
  ],

  blockedRequests: async ({ networkGuard }, provide) => {
    await provide(networkGuard);
  },
});

export { expect };
