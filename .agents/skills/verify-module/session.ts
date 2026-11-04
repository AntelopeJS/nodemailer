import {
  equal,
  type App,
  type CallResult,
  type Check,
  type HttpResult,
  type JourneyContext,
} from "@antelopejs/tooling-configs/verify";

import { canonical, isString, pick, tuple, type Json } from "./json.ts";
import { startSmtpSink, type SmtpSink } from "./smtp-sink.ts";

export { pick, tuple, type Json } from "./json.ts";
export type ModuleConfig = NonNullable<NonNullable<Parameters<JourneyContext["fixture"]>[0]>["moduleConfig"]>;

export const DEFAULT_FROM = "Verify <verify@example.test>";

export interface Session {
  context: JourneyContext;
  sink: SmtpSink;
  app: App;
}

/** Starts the SMTP stand-in, loads the module in `ajs project dev` configured to deliver to it, and hands both to `run`. */
export async function withSession(context: JourneyContext, run: (session: Session) => Promise<void>, extra: ModuleConfig = {}): Promise<void> {
  const sink = await startSmtpSink();
  try {
    const project = context.fixture({ moduleConfig: { host: "127.0.0.1", port: sink.port, secure: false, defaults: { from: DEFAULT_FROM }, ...extra } });
    const app = await context.dev("ajs-project-dev", project);
    await run({ context, sink, app });
  } finally {
    await sink.close();
  }
}

export function call(session: Session, name: string, path: string, args: Json[]): Promise<CallResult> {
  return session.context.call(name, session.app, { path: [path], args });
}

export interface Seen {
  result: HttpResult;
  entries: Json[];
}

/** Reads the messages the stand-in accepted so far, through its own `/__log` endpoint. */
export async function delivered(session: Session, name: string): Promise<Seen> {
  const result = await session.context.http(name, `${session.sink.url}/__log`);
  return { result, entries: Array.isArray(result.json) ? result.json : [] };
}

/** The value of a header in the raw message of a delivery, unfolded; `null` when the message has no such header. */
export function header(entry: Json | undefined, name: string): Json {
  const data = pick(entry, "data");
  if (!isString(data)) return null;
  const head = data.split("\r\n\r\n")[0] ?? "";
  const line = head.replace(/\r\n[ \t]+/g, " ").split("\r\n").find((candidate) => candidate.toLowerCase().startsWith(`${name.toLowerCase()}:`));
  return line === undefined ? null : line.slice(name.length + 1).trim();
}

/** True when the raw message of a delivery contains `text`. */
export function bodyHas(entry: Json | undefined, text: string): boolean {
  const data = pick(entry, "data");
  return isString(data) && data.includes(text);
}

/** `equal` that ignores key order; an absent value, also inside an array, reads as `null`. */
export function same(name: string, actual: Json | undefined | (Json | undefined)[], expected: Json): Check {
  return equal(name, canonical(Array.isArray(actual) ? tuple(...actual) : actual), canonical(expected));
}

export function answered(result: CallResult): Check {
  return { name: "the call through core answered", pass: result.ok, detail: result.ok ? "ok" : `${result.body}` };
}
