import type { Journey } from "@antelopejs/tooling-configs/verify";

import { isString } from "./json.ts";
import { DEFAULT_FROM, answered, bodyHas, call, delivered, header, pick, same, withSession } from "./session.ts";

function errorMessage(value: Parameters<typeof pick>[0]): string {
  const message = pick(value, "error", "message");
  return isString(message) ? message : "";
}

const sendMessage: Journey = {
  title: "Send delivers one SMTP message from the configured sender to every to, cc and bcc recipient, with the subject, reply-to and both bodies",
  entryPoint: "`Send` through core against the SMTP stand-in",
  async run(context) {
    await withSession(context, async (session) => {
      const sent = await call(session, "Send", "Send", [
        {
          to: ["ada@example.com", { email: "bob@example.com", name: "Bob" }],
          cc: "cy@example.com",
          bcc: "di@example.com",
          replyTo: "help@example.com",
          subject: "Hello there",
          text: "Plain words",
          html: "<p>Html words</p>",
        },
      ]);
      const seen = await delivered(session, "smtp-log");
      context.expect(sent.folder, [answered(sent), same("the send succeeded", pick(sent.value, "success"), true), same("the provider is nodemailer", pick(sent.value, "provider"), "nodemailer")]);
      context.expect(seen.result.folder, [
        same("one message was delivered", seen.entries.length, 1),
        same("the envelope sender is the configured one", pick(seen.entries[0], "from"), "verify@example.test"),
        same("every to, cc and bcc recipient is in the envelope", pick(seen.entries[0], "to"), ["ada@example.com", "bob@example.com", "cy@example.com", "di@example.com"]),
        same("the headers carry the sender, subject and reply-to", [header(seen.entries[0], "From"), header(seen.entries[0], "Subject"), header(seen.entries[0], "Reply-To")], [DEFAULT_FROM, "Hello there", "help@example.com"]),
        same("bcc stays out of the headers", [header(seen.entries[0], "Cc"), header(seen.entries[0], "Bcc")], ["cy@example.com", null]),
        same("both bodies are in the message", [bodyHas(seen.entries[0], "Plain words"), bodyHas(seen.entries[0], "<p>Html words</p>")], [true, true]),
      ]);
    });
  },
};

const sendFailure: Journey = {
  title: "when the SMTP server refuses a recipient the answer is a failed SEND_FAILED response carrying the server's refusal, and nothing is delivered",
  entryPoint: "`Send` to a recipient the SMTP stand-in refuses with 550",
  async run(context) {
    await withSession(context, async (session) => {
      const sent = await call(session, "Send", "Send", [{ to: "reject@example.com", subject: "No", text: "No" }]);
      const seen = await delivered(session, "smtp-log");
      context.expect(sent.folder, [
        answered(sent),
        same("the send failed", pick(sent.value, "success"), false),
        same("the error code is SEND_FAILED", pick(sent.value, "error", "code"), "SEND_FAILED"),
        same("the message carries the server's refusal", errorMessage(sent.value).includes("no such user"), true),
      ]);
      context.expect(seen.result.folder, [same("nothing was delivered", seen.entries.length, 0)]);
    });
  },
};

export const sendJourneys = { "send-message": sendMessage, "send-failure": sendFailure };
