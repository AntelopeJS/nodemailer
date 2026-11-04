import { createServer as createHttp } from "node:http";
import { createServer, type AddressInfo, type Server, type Socket } from "node:net";

/** One message the sink accepted. */
export interface Delivered {
  from: string;
  to: string[];
  data: string;
  user: string | null;
  pass: string | null;
}

/** The stand-in for an SMTP server: it records every message and refuses recipients that contain `reject`. */
export interface SmtpSink {
  port: number;
  url: string;
  close(): Promise<void>;
}

interface Connection {
  from: string;
  to: string[];
  data: string[];
  mode: "command" | "data" | "login-user" | "login-pass" | "plain";
  user: string | null;
  pass: string | null;
}

const CRLF = "\r\n";
const ADDRESS = /<([^>]*)>/;

function addressOf(line: string): string {
  return ADDRESS.exec(line)?.[1] ?? "";
}

function decode(text: string): string {
  return Buffer.from(text, "base64").toString("utf8");
}

function isAddress(address: ReturnType<Server["address"]>): address is AddressInfo {
  return address !== null && typeof address === "object";
}

function listen(server: Server): Promise<number> {
  return new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!isAddress(address)) {
        reject(new Error("the stand-in did not bind a TCP port"));
        return;
      }
      resolve(address.port);
    });
  });
}

function handleCommand(socket: Socket, state: Connection, line: string): void {
  const verb = line.slice(0, 4).toUpperCase();
  if (verb === "EHLO" || verb === "HELO") {
    socket.write(`250-sink${CRLF}250-AUTH PLAIN LOGIN${CRLF}250 8BITMIME${CRLF}`);
  } else if (line.toUpperCase().startsWith("AUTH PLAIN")) {
    const inline = line.slice("AUTH PLAIN".length).trim();
    if (inline === "") {
      state.mode = "plain";
      socket.write(`334 ${CRLF}`);
    } else {
      const [, user = "", pass = ""] = decode(inline).split("\u0000");
      state.user = user;
      state.pass = pass;
      socket.write(`235 ok${CRLF}`);
    }
  } else if (line.toUpperCase().startsWith("AUTH LOGIN")) {
    state.mode = "login-user";
    socket.write(`334 VXNlcm5hbWU6${CRLF}`);
  } else if (verb === "MAIL") {
    state.from = addressOf(line);
    state.to = [];
    socket.write(`250 ok${CRLF}`);
  } else if (verb === "RCPT") {
    const recipient = addressOf(line);
    if (recipient.includes("reject")) {
      socket.write(`550 no such user${CRLF}`);
    } else {
      state.to.push(recipient);
      socket.write(`250 ok${CRLF}`);
    }
  } else if (verb === "DATA") {
    state.mode = "data";
    state.data = [];
    socket.write(`354 go ahead${CRLF}`);
  } else if (verb === "QUIT") {
    socket.end(`221 bye${CRLF}`);
  } else {
    socket.write(`250 ok${CRLF}`);
  }
}

function handleLine(socket: Socket, state: Connection, line: string, log: Delivered[]): void {
  if (state.mode === "command") {
    handleCommand(socket, state, line);
  } else if (state.mode === "plain") {
    const [, user = "", pass = ""] = decode(line).split("\u0000");
    state.user = user;
    state.pass = pass;
    state.mode = "command";
    socket.write(`235 ok${CRLF}`);
  } else if (state.mode === "login-user") {
    state.user = decode(line);
    state.mode = "login-pass";
    socket.write(`334 UGFzc3dvcmQ6${CRLF}`);
  } else if (state.mode === "login-pass") {
    state.pass = decode(line);
    state.mode = "command";
    socket.write(`235 ok${CRLF}`);
  } else if (line === ".") {
    log.push({ from: state.from, to: state.to, data: state.data.join(CRLF), user: state.user, pass: state.pass });
    state.mode = "command";
    socket.write(`250 queued${CRLF}`);
  } else {
    state.data.push(line.startsWith("..") ? line.slice(1) : line);
  }
}

function serve(socket: Socket, log: Delivered[]): void {
  const state: Connection = { from: "", to: [], data: [], mode: "command", user: null, pass: null };
  let buffer = "";
  socket.write(`220 sink ready${CRLF}`);
  socket.on("data", (chunk: Buffer) => {
    buffer += chunk.toString("utf8");
    for (let end = buffer.indexOf(CRLF); end >= 0; end = buffer.indexOf(CRLF)) {
      const line = buffer.slice(0, end);
      buffer = buffer.slice(end + CRLF.length);
      handleLine(socket, state, line, log);
    }
  });
  socket.on("error", () => socket.destroy());
}

/** Starts the sink on free loopback ports. `GET /__log` on the HTTP port answers the recorded messages as JSON, the second view a journey reads through `context.http`. */
export async function startSmtpSink(): Promise<SmtpSink> {
  const log: Delivered[] = [];
  const sockets = new Set<Socket>();
  const smtp = createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    serve(socket, log);
  });
  const http = createHttp((_request, response) => {
    response.writeHead(200, { "content-type": "application/json" });
    response.end(JSON.stringify(log));
  });
  const port = await listen(smtp);
  const httpPort = await listen(http);
  return {
    port,
    url: `http://127.0.0.1:${httpPort}`,
    close: () =>
      new Promise((resolve) => {
        for (const socket of sockets) socket.destroy();
        http.closeAllConnections();
        smtp.close(() => http.close(() => resolve()));
      }),
  };
}
