import type { Journey } from "@antelopejs/tooling-configs/verify";

import { answered, call, delivered, pick, same, withSession } from "./session.ts";

const capabilities: Journey = {
  title: "GetCapabilities names the provider and the features the module supports",
  entryPoint: "`GetCapabilities` of the email interface called through core",
  async run(context) {
    await withSession(context, async (session) => {
      const answer = await call(session, "GetCapabilities", "GetCapabilities", []);
      context.expect(answer.folder, [
        answered(answer),
        same("the provider is nodemailer", pick(answer.value, "name"), "nodemailer"),
        same("the supported features are exactly the module's", pick(answer.value, "features"), {
          batch: true,
          templates: true,
          scheduling: false,
          openTracking: false,
          clickTracking: false,
          inlineAttachments: true,
          tags: false,
          metadata: false,
          priority: true,
        }),
      ]);
    });
  },
};

const authCredentials: Journey = {
  title: "the configured auth user and password reach the SMTP server, and a message with a priority and an explicit sender keeps both",
  entryPoint: "`Send` with `auth` in the module config against an SMTP server that offers AUTH",
  async run(context) {
    await withSession(
      context,
      async (session) => {
        const sent = await call(session, "Send", "Send", [{ to: "ada@example.com", from: "boss@example.com", subject: "Urgent", text: "Now", priority: "high" }]);
        const seen = await delivered(session, "smtp-log");
        context.expect(sent.folder, [answered(sent), same("the send succeeded", pick(sent.value, "success"), true)]);
        context.expect(seen.result.folder, [
          same("the server saw the configured credentials", [pick(seen.entries[0], "user"), pick(seen.entries[0], "pass")], ["mailer", "s3cret"]),
          same("the explicit sender replaces the configured one", pick(seen.entries[0], "from"), "boss@example.com"),
        ]);
      },
      { auth: { user: "mailer", pass: "s3cret" } },
    );
  },
};

export const transportJourneys = { capabilities, "auth-credentials": authCredentials };
