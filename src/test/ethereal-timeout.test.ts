import assert from "node:assert";
import { randomUUID } from "node:crypto";
import net from "node:net";
import { Logging } from "@antelopejs/interface-core/logging";
import nodemailer from "nodemailer";
import sinon, { type SinonFakeTimers, type SinonSandbox } from "sinon";

import { initTransporter, Send } from "../implementations/email";

const STARTUP_BOUND_MS = 10_000;

function isAddressInfo(
  address: ReturnType<net.Server["address"]>,
): address is net.AddressInfo {
  return address !== null && typeof address !== "string";
}

interface SilentServer {
  url: string;
  close: () => Promise<void>;
}

async function startSilentServer(): Promise<SilentServer> {
  const sockets = new Set<net.Socket>();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(isAddressInfo(address));
  return {
    url: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise<void>((resolve) => {
        for (const socket of sockets) {
          socket.destroy();
        }
        server.close(() => resolve());
      }),
  };
}

describe("Ethereal account API that never answers", () => {
  let server: SilentServer;
  let sandbox: SinonSandbox;
  let clock: SinonFakeTimers;

  beforeEach(async () => {
    server = await startSilentServer();
    sandbox = sinon.createSandbox();
    const createTestAccount = nodemailer.createTestAccount.bind(nodemailer);
    sandbox
      .stub(nodemailer, "createTestAccount")
      .callsFake(() => createTestAccount(server.url));
    clock = sandbox.useFakeTimers({ toFake: ["setTimeout", "clearTimeout"] });
  });

  afterEach(async () => {
    sandbox.restore();
    await server.close();
  });

  it("starts without a transporter and warns once within the bound", async () => {
    const warn = sandbox.stub(Logging, "Warn");
    let outcome = "pending";
    const init = initTransporter({ ethereal: true }).then(
      () => {
        outcome = "started";
      },
      () => {
        outcome = "failed";
      },
    );

    await clock.tickAsync(STARTUP_BOUND_MS);
    const outcomeAtBound = outcome;
    clock.restore();
    await server.close();
    await init;
    const result = await Send({
      from: "sender@example.com",
      to: "to@example.com",
      subject: "Ethereal down",
      text: "body",
    });

    assert.equal(outcomeAtBound, "started");
    assert.equal(warn.callCount, 1);
    assert.equal(
      result.error?.message,
      "[Email] Transporter is not initialized",
    );
  });
});

describe("Ethereal account API that answers", () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  it("leaves no pending timer once the account arrives", async () => {
    const clock = sandbox.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout"],
    });
    sandbox.stub(Logging, "Info");
    sandbox.stub(nodemailer, "createTestAccount").resolves({
      user: randomUUID(),
      pass: randomUUID(),
      smtp: { host: "smtp.ethereal.email", port: 587, secure: false },
      imap: { host: "imap.ethereal.email", port: 993, secure: true },
      pop3: { host: "pop3.ethereal.email", port: 995, secure: true },
      web: "https://ethereal.email",
    });

    await initTransporter({ ethereal: true });

    assert.equal(clock.countTimers(), 0);
  });
});
