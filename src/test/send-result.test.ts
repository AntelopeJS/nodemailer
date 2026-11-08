import assert from "node:assert";
import nodemailer from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";
import sinon, { type SinonSandbox } from "sinon";

import { initTransporter, Send } from "../implementations/email";

const SMTP_HOST = "smtp.example.com";
const SMTP_PORT = 587;
const TO_EMAIL = "to@example.com";
const INHERITED_MESSAGE_ID = "inherited-message-id";

type SendMail = (
  ...args: Parameters<ReturnType<typeof nodemailer.createTransport>["sendMail"]>
) => Promise<SMTPTransport.SentMessageInfo>;

class InheritedMessageId {
  get messageId(): string {
    return INHERITED_MESSAGE_ID;
  }
}

function createInheritedMessageIdInfo(): SMTPTransport.SentMessageInfo {
  return Object.assign(new InheritedMessageId(), {
    envelope: { from: false as const, to: [TO_EMAIL] },
    accepted: [TO_EMAIL],
    rejected: [],
    pending: [],
    response: "250 OK",
  });
}

const UNCONVERTIBLE_REJECTIONS: [string, () => object | symbol][] = [
  ["a null-prototype object", () => ({ __proto__: null })],
  [
    "an object whose toString throws",
    () => ({
      toString(): string {
        throw new Error("toString failed");
      },
    }),
  ],
  ["a symbol", () => Symbol("failure")],
  [
    "an Error whose message getter throws",
    () =>
      Object.defineProperty(new Error("hidden"), "message", {
        get(): string {
          throw new Error("message getter failed");
        },
      }),
  ],
  [
    "a revoked proxy",
    () => {
      const { proxy, revoke } = Proxy.revocable({}, {});
      revoke();
      return proxy;
    },
  ],
];

async function useSendMail(
  sandbox: SinonSandbox,
  sendMail: SendMail,
): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
  });
  sandbox.stub(transporter, "sendMail").callsFake(sendMail);
  sandbox.stub(nodemailer, "createTransport").returns(transporter);
  sandbox.stub(nodemailer, "getTestMessageUrl").returns(false);
  await initTransporter({ host: SMTP_HOST, port: SMTP_PORT });
}

describe("Send result", () => {
  let sandbox: SinonSandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  for (const [label, createRejection] of UNCONVERTIBLE_REJECTIONS) {
    it(`resolves to SEND_FAILED when sendMail rejects with ${label}`, async () => {
      await useSendMail(sandbox, () => Promise.reject(createRejection()));

      const result = await Send({ to: TO_EMAIL, subject: "subject" });

      assert.equal(result.success, false);
      assert.equal(result.error?.code, "SEND_FAILED");
    });
  }

  it("reports no messageId when sendMail resolves with an inherited one", async () => {
    await useSendMail(sandbox, () =>
      Promise.resolve(createInheritedMessageIdInfo()),
    );

    const result = await Send({ to: TO_EMAIL, subject: "subject" });

    assert.equal(result.success, true);
    assert.equal(result.messageId, undefined);
  });
});
