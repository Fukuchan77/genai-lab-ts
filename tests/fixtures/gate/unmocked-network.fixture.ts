import net from "node:net";
import { expect, it } from "vitest";

// Input for network-guard.test.ts (a). The test swallows every error on purpose: the guard must
// still fail it, because the violation is recorded and reported in afterEach.
it("reaches the network without a mock", async () => {
  try {
    await fetch("https://fixture.invalid/resource?token=not-a-secret");
  } catch {
    // swallowed on purpose
  }
  const socket = new net.Socket();
  socket.on("error", () => {});
  try {
    socket.connect(9, "127.0.0.1");
  } catch {
    // swallowed on purpose
  }
  socket.destroy();
  expect(true).toBe(true);
});
