import type { Journey } from "@antelopejs/tooling-configs/verify";

import { answered, call, delivered, pick, same, withSession } from "./session.ts";

const sendThroughSink: Journey = {
  title: "a consumer's Send reaches the SMTP server and comes back successful",
  entryPoint: "`Send` through core against the SMTP stand-in",
  async run(context) {
    await withSession(context, async (session) => {
      const sent = await call(session, "Send", "Send", [{ to: "ada@example.com", subject: "Hello", text: "Hello" }]);
      const seen = await delivered(session, "smtp-log");
      context.expect(sent.folder, [answered(sent), same("the send succeeded", pick(sent.value, "success"), true)]);
      context.expect(seen.result.folder, [same("the server received the message for the recipient", seen.entries.map((entry) => pick(entry, "to")), [["ada@example.com"]])]);
    });
  },
};

export const smokeJourneys = { "send-through-sink": sendThroughSink };
