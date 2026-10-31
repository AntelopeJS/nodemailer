import type { Journey } from "@antelopejs/tooling-configs/verify";

import { answered, call, delivered, pick, same, withSession } from "./session.ts";

const MESSAGES = [{ to: "a@example.com" }, { to: "reject@example.com" }, { to: "c@example.com" }];
const DEFAULTS = { subject: "Batch", text: "Batch body" };

const batchContinues: Journey = {
  title: "SendBatch sends every message with the shared defaults, counts successes and failures, and goes on after a failure",
  entryPoint: "`SendBatch` of three messages, the second refused, through core",
  async run(context) {
    await withSession(context, async (session) => {
      const sent = await call(session, "SendBatch", "SendBatch", [{ messages: MESSAGES, defaults: DEFAULTS }]);
      const seen = await delivered(session, "smtp-log");
      context.expect(sent.folder, [
        answered(sent),
        same("the totals are three, two sent and one failed", [pick(sent.value, "total"), pick(sent.value, "successful"), pick(sent.value, "failed"), pick(sent.value, "success")], [3, 2, 1, false]),
        same("the answers keep the message order", [pick(sent.value, "responses", 0, "success"), pick(sent.value, "responses", 1, "success"), pick(sent.value, "responses", 2, "success")], [true, false, true]),
      ]);
      context.expect(seen.result.folder, [same("the two accepted messages were delivered to their recipients", seen.entries.map((entry) => pick(entry, "to", 0)), ["a@example.com", "c@example.com"])]);
    });
  },
};

const batchStops: Journey = {
  title: "SendBatch with continueOnError false stops at the first failure and leaves the rest unsent",
  entryPoint: "`SendBatch` with `continueOnError: false`, the second of three messages refused",
  async run(context) {
    await withSession(context, async (session) => {
      const sent = await call(session, "SendBatch", "SendBatch", [{ messages: MESSAGES, defaults: DEFAULTS, continueOnError: false }]);
      const seen = await delivered(session, "smtp-log");
      context.expect(sent.folder, [
        answered(sent),
        same("two answers exist and the batch failed", [pick(sent.value, "responses", 1, "success"), pick(sent.value, "responses", 2), pick(sent.value, "failed")], [false, null, 1]),
      ]);
      context.expect(seen.result.folder, [same("only the first message was delivered", seen.entries.map((entry) => pick(entry, "to", 0)), ["a@example.com"])]);
    });
  },
};

export const batchJourneys = { "batch-continues": batchContinues, "batch-stops": batchStops };
