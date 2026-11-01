import assert from "node:assert";
import net from "node:net";

import { initTransporter, Send } from "../implementations/email";

interface PlainSmtpServer {
  port: number;
  commands: string[];
  close: () => Promise<void>;
}

function reply(command: string): string {
  const verb = command.split(" ")[0]?.toUpperCase();
  if (verb === "EHLO") {
    return "250-plain.test\r\n250 AUTH PLAIN LOGIN\r\n";
  }
  if (verb === "AUTH") {
    return "235 Authenticated\r\n";
  }
  if (verb === "DATA") {
    return "354 Go ahead\r\n";
  }
  if (verb === "STARTTLS") {
    return "502 Not implemented\r\n";
  }
  return "250 OK\r\n";
}

function handleSession(socket: net.Socket, commands: string[]): void {
  let buffer = "";
  let inData = false;
  socket.write("220 plain.test ESMTP\r\n");
  socket.on("data", (chunk) => {
    buffer += chunk.toString("utf8");
    let end = buffer.indexOf("\r\n");
    while (end >= 0) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + 2);
      if (inData) {
        inData = line !== ".";
        if (!inData) {
          socket.write("250 Queued\r\n");
        }
      } else {
        commands.push(line);
        inData = line.toUpperCase() === "DATA";
        socket.write(reply(line));
      }
      end = buffer.indexOf("\r\n");
    }
  });
  socket.on("error", () => socket.destroy());
}

async function startPlainSmtpServer(): Promise<PlainSmtpServer> {
  const commands: string[] = [];
  const sockets = new Set<net.Socket>();
  const server = net.createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    handleSession(socket, commands);
  });
  await new Promise<void>((resolve) => {
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert(address instanceof Object);
  const { port } = address;
  return {
    port,
    commands,
    close: () =>
      new Promise<void>((resolve) => {
        for (const socket of sockets) {
          socket.destroy();
        }
        server.close(() => resolve());
      }),
  };
}

function authCommands(server: PlainSmtpServer): string[] {
  return server.commands.filter((command) => /^AUTH\b/i.test(command));
}

async function sendWithAuth(
  server: PlainSmtpServer,
  extraConfig: { requireTLS?: boolean } = {},
) {
  await initTransporter({
    host: "127.0.0.1",
    port: server.port,
    secure: false,
    auth: { user: "smtp-user", pass: "smtp-secret" },
    ...extraConfig,
  });
  return Send({
    from: "sender@example.com",
    to: "to@example.com",
    subject: "STARTTLS",
    text: "body",
  });
}

describe("SMTP session without STARTTLS", () => {
  let server: PlainSmtpServer;

  beforeEach(async () => {
    server = await startPlainSmtpServer();
  });

  afterEach(async () => {
    await server.close();
  });

  it("refuses to authenticate in clear text when auth is set", async () => {
    const result = await sendWithAuth(server);

    assert.equal(result.success, false);
    assert.deepStrictEqual(authCommands(server), []);
  });

  it("authenticates in clear text only when requireTLS is false", async () => {
    const result = await sendWithAuth(server, { requireTLS: false });

    assert.equal(result.success, true);
    assert.equal(authCommands(server).length, 1);
  });
});
