import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "../../../e2e/fixtures";

// Input for gate-self-check.test.ts (e). The page asks for an external origin that WOULD answer: a
// local server on a random port (offline, deterministic). If the guard only recorded the request and
// let it through, the server would be hit and the fetch would succeed. So the test proves two things:
// the request is aborted before it leaves the browser, and the test then fails in teardown
// (default `failOnBlockedRequest: true`). The URL carries a query on purpose: the failure message may
// name the origin but never the query.
test("requests an external origin @smoke", async ({ page }) => {
  let hits = 0;
  const server = createServer((_request, response) => {
    hits++;
    response.writeHead(200, { "access-control-allow-origin": "*" });
    response.end("reached");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address() as AddressInfo;
    await page.setContent("<p>external request</p>");
    const outcome = await page.evaluate(
      (url) =>
        fetch(url).then(
          () => "reached",
          () => "blocked",
        ),
      `http://127.0.0.1:${port}/pixel?token=not-a-secret`,
    );
    expect(outcome).toBe("blocked");
    expect(hits).toBe(0);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
