import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { expect, test } from "./fixtures";

// The guard normally fails a test in teardown when it reaches an external origin. This smoke test
// switches that teardown failure off so it can assert on the guard's own record instead. `test.fail()`
// is not used: it passes on any failure, including an unrelated `page.goto` error (spec 001, 3.11).
test.use({ failOnBlockedRequest: false });

test("the external-origin guard blocks and records an unmocked request @smoke", async ({
  page,
  blockedRequests,
}) => {
  // A real local server on another origin: if the guard let the request through, the server would
  // answer it. Offline and deterministic.
  let hits = 0;
  const server = createServer((_request, response) => {
    hits++;
    response.writeHead(200, { "access-control-allow-origin": "*" });
    response.end("reached");
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const { port } = server.address() as AddressInfo;
    const externalUrl = `http://127.0.0.1:${port}/external`;

    await page.goto("/");
    const outcome = await page.evaluate(
      (url) =>
        fetch(url).then(
          () => "reached",
          () => "blocked",
        ),
      externalUrl,
    );

    // (b) the request never reached the network
    expect(outcome).toBe("blocked");
    expect(hits).toBe(0);
    // (a) the guard recorded exactly that request
    expect(blockedRequests).toEqual([{ method: "GET", url: externalUrl }]);
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }
});
