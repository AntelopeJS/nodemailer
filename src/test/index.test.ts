import assert from "node:assert";
import path from "node:path";
import { createRuntime, type EmbeddedModuleConfig } from "@antelopejs/core";
import nodemailer from "nodemailer";
import { Logging } from "@antelopejs/interface-core/logging";
import type { EmailParams } from "@antelopejs/interface-email";
import sinon, { type SinonSandbox } from "sinon";
import type { SendMailOptions } from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

import {
  GetCapabilities,
  initTransporter,
  Send,
  SendBatch,
  SendTemplate,
} from "../implementations/email";

const SMTP_HOST = "smtp.example.com";
const SMTP_PORT = 587;
const DEFAULT_FROM = "noreply@example.com";
const SUBJECT = "Interface test";
const MESSAGE_ID = "message-id-123";
const PREVIEW_URL = "https://preview.example.com";
const TO_EMAIL = "to@example.com";
const CC_EMAIL = "cc@example.com";
const BCC_EMAIL = "bcc@example.com";
const REPLY_TO_EMAIL = "reply@example.com";
const FROM_EMAIL = "sender@example.com";
const FROM_NAME = "Sender";
const RECIPIENT_NAME = "Receiver";
const BASE64_CONTENT = "SGVsbG8=";
const BUFFER_CONTENT = "Buffer content";
const URL_ATTACHMENT = "https://example.com/logo.png";
const REFERENCE_A = "reference-a";
const REFERENCE_B = "reference-b";
const ETHEREAL_USER = "ethereal@example.com";
const ETHEREAL_PASS = "ethereal-pass";
const ETHEREAL_HOST = "smtp.ethereal.email";
const ETHEREAL_PORT = 587;
const SMTP_FAILURE = "SMTP unavailable";

interface DefaultSenderConfig {
  from: string;
}

interface TransportConfig {
  host: string;
  port: number;
  secure: boolean;
  defaults: DefaultSenderConfig;
}

type EtherealAccount = Awaited<ReturnType<typeof nodemailer.createTestAccount>>;

const DEFAULT_CONFIG: TransportConfig = {
  host: SMTP_HOST,
  port: SMTP_PORT,
  secure: false,
  defaults: {
    from: DEFAULT_FROM,
  },
};

function createSentMessageInfo(
  messageId: string,
): SMTPTransport.SentMessageInfo {
  return {
    envelope: { from: DEFAULT_FROM, to: [TO_EMAIL] },
    messageId,
    accepted: [TO_EMAIL],
    rejected: [],
    pending: [],
    response: "250 OK",
  };
}

function createEtherealAccount(): EtherealAccount {
  return {
    user: ETHEREAL_USER,
    pass: ETHEREAL_PASS,
    smtp: {
      host: ETHEREAL_HOST,
      port: ETHEREAL_PORT,
      secure: false,
    },
    imap: {
      host: "imap.ethereal.email",
      port: 993,
      secure: true,
    },
    pop3: {
      host: "pop.ethereal.email",
      port: 995,
      secure: true,
    },
    web: "https://ethereal.email",
  };
}

function stubTransport(sandbox: SinonSandbox) {
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
  });
  const sendMail = sandbox.stub(transporter, "sendMail");
  const createTransport = sandbox
    .stub(nodemailer, "createTransport")
    .returns(transporter);
  sandbox.stub(nodemailer, "getTestMessageUrl").returns(PREVIEW_URL);
  sandbox.stub(Logging, "Info");
  return { sendMail, createTransport };
}

type SendMailStub = ReturnType<typeof stubTransport>["sendMail"];

function getFirstMailOptions(sendMail: SendMailStub): SendMailOptions {
  const firstCall = sendMail.getCall(0);
  assert.ok(firstCall, "Expected at least one sendMail call");
  const options = firstCall.args[0];
  assert.ok(options, "Expected sendMail options");
  return options;
}

async function initializeTransporterWithStubs(
  sandbox: SinonSandbox,
): Promise<SendMailStub> {
  const { sendMail } = stubTransport(sandbox);
  await initTransporter(DEFAULT_CONFIG);
  return sendMail;
}

function createSendParams(): EmailParams {
  return {
    to: { email: TO_EMAIL, name: RECIPIENT_NAME },
    cc: CC_EMAIL,
    bcc: BCC_EMAIL,
    replyTo: REPLY_TO_EMAIL,
    from: { email: FROM_EMAIL, name: FROM_NAME },
    subject: SUBJECT,
    text: "text content",
    html: "<p>html content</p>",
    priority: "high",
    references: [REFERENCE_A, REFERENCE_B],
    attachments: [
      {
        filename: "buffer.txt",
        content: Buffer.from(BUFFER_CONTENT),
      },
      {
        filename: "base64.txt",
        content: BASE64_CONTENT,
        encoding: "base64",
      },
      {
        filename: "remote.png",
        url: URL_ATTACHMENT,
      },
    ],
  };
}

let sandbox: SinonSandbox;

async function startModule(module: EmbeddedModuleConfig): Promise<void> {
  const root = path.resolve(__dirname, "..", "..");
  await createRuntime({
    modules: { nodemailer: { ...module, path: root } },
    logging: { enabled: false },
  }).start();
}

function useSandbox(): void {
  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });
}

describe("Email interface", () => {
  useSandbox();

  it("returns provider capabilities", async () => {
    const capabilities = await GetCapabilities();

    assert.equal(capabilities.name, "nodemailer");
    assert.equal(capabilities.features.batch, true);
    assert.equal(capabilities.features.templates, true);
    assert.equal(capabilities.features.scheduling, false);
    assert.equal(capabilities.features.openTracking, false);
    assert.equal(capabilities.features.clickTracking, false);
    assert.equal(capabilities.features.inlineAttachments, true);
    assert.equal(capabilities.features.tags, false);
    assert.equal(capabilities.features.metadata, false);
    assert.equal(capabilities.features.priority, true);
  });

  it("sends emails with mapped nodemailer options", async () => {
    const sendMailStub = await initializeTransporterWithStubs(sandbox);
    sendMailStub.resolves(createSentMessageInfo(MESSAGE_ID));

    const result = await Send(createSendParams());
    const options = getFirstMailOptions(sendMailStub);

    assert.equal(result.success, true);
    assert.equal(result.status, "sent");
    assert.equal(result.provider, "nodemailer");
    assert.equal(result.messageId, MESSAGE_ID);

    assert.equal(options.from, `"${FROM_NAME}" <${FROM_EMAIL}>`);
    assert.equal(options.to, `"${RECIPIENT_NAME}" <${TO_EMAIL}>`);
    assert.equal(options.cc, CC_EMAIL);
    assert.equal(options.bcc, BCC_EMAIL);
    assert.equal(options.replyTo, REPLY_TO_EMAIL);
    assert.equal(options.references, `${REFERENCE_A} ${REFERENCE_B}`);
    assert.equal(options.priority, "high");

    const attachments = options.attachments ?? [];
    assert.equal(attachments.length, 3);

    const [firstAttachment, secondAttachment, thirdAttachment] = attachments;

    assert.equal(Buffer.isBuffer(firstAttachment?.content), true);
    assert.equal(secondAttachment?.encoding, "base64");
    assert.equal(secondAttachment?.content, BASE64_CONTENT);
    assert.equal(thirdAttachment?.path, URL_ATTACHMENT);
  });

  it("uses configured default sender when sender is missing", async () => {
    const sendMailStub = await initializeTransporterWithStubs(sandbox);
    sendMailStub.resolves(createSentMessageInfo(MESSAGE_ID));

    await Send({
      to: TO_EMAIL,
      subject: SUBJECT,
      text: "content",
    });

    const options = getFirstMailOptions(sendMailStub);
    assert.equal(options.from, DEFAULT_FROM);
  });

  it("returns failed response when transporter throws", async () => {
    const sendMailStub = await initializeTransporterWithStubs(sandbox);
    sendMailStub.rejects(new Error(SMTP_FAILURE));

    const result = await Send({
      to: TO_EMAIL,
      subject: SUBJECT,
      text: "content",
    });

    assert.equal(result.success, false);
    assert.equal(result.status, "failed");
    assert.equal(result.error?.code, "SEND_FAILED");
    assert.equal(result.error?.message, SMTP_FAILURE);
    assert.equal(result.error?.retryable, true);
  });
});

describe("Email interface", () => {
  useSandbox();

  it("stops batch execution when continueOnError is disabled", async () => {
    const sendMailStub = await initializeTransporterWithStubs(sandbox);
    sendMailStub.onFirstCall().rejects(new Error(SMTP_FAILURE));
    sendMailStub.onSecondCall().resolves(createSentMessageInfo(MESSAGE_ID));

    const result = await SendBatch({
      continueOnError: false,
      messages: [
        {
          to: TO_EMAIL,
          subject: "batch-1",
          text: "first",
          batchId: "batch-1",
        },
        {
          to: "second@example.com",
          subject: "batch-2",
          text: "second",
          batchId: "batch-2",
        },
      ],
    });

    assert.equal(sendMailStub.callCount, 1);
    assert.equal(result.success, false);
    assert.equal(result.total, 2);
    assert.equal(result.successful, 0);
    assert.equal(result.failed, 1);
    assert.equal(result.responses.length, 1);
    assert.equal(result.responses[0]?.recipient, TO_EMAIL);
    assert.equal(result.responses[0]?.batchId, "batch-1");
  });

  it("renders inline templates before sending", async () => {
    const sendMailStub = await initializeTransporterWithStubs(sandbox);
    sendMailStub.resolves(createSentMessageInfo(MESSAGE_ID));

    const result = await SendTemplate({
      to: TO_EMAIL,
      subject: SUBJECT,
      template: {
        type: "html",
        content: "<p>Hello {{ name }}</p>",
      },
      variables: {
        name: "Antelope",
      },
    });

    const options = getFirstMailOptions(sendMailStub);

    assert.equal(result.success, true);
    assert.equal(options.html, "<p>Hello Antelope</p>");
  });

  it("returns NOT_SUPPORTED for provider templates", async () => {
    const sendMailStub = await initializeTransporterWithStubs(sandbox);
    sendMailStub.resolves(createSentMessageInfo(MESSAGE_ID));

    const result = await SendTemplate({
      to: TO_EMAIL,
      subject: SUBJECT,
      template: {
        id: "provider-template",
      },
    });

    assert.equal(sendMailStub.callCount, 0);
    assert.equal(result.success, false);
    assert.equal(result.error?.code, "NOT_SUPPORTED");
  });

  it("initializes ethereal transporter when configured", async () => {
    const { sendMail: sendMailStub, createTransport: createTransportStub } =
      stubTransport(sandbox);
    sendMailStub.resolves(createSentMessageInfo(MESSAGE_ID));
    sandbox
      .stub(nodemailer, "createTestAccount")
      .resolves(createEtherealAccount());

    await initTransporter({ ethereal: true });
    await Send({
      to: TO_EMAIL,
      subject: SUBJECT,
      text: "content",
    });

    const options = getFirstMailOptions(sendMailStub);
    const transportCall = createTransportStub.getCall(0);
    assert.ok(transportCall, "Expected createTransport call");

    assert.equal(options.from, ETHEREAL_USER);
    assert.deepStrictEqual(transportCall.args[0], {
      host: ETHEREAL_HOST,
      port: ETHEREAL_PORT,
      secure: false,
      auth: { user: ETHEREAL_USER, pass: ETHEREAL_PASS },
    });
  });
});

describe("Email configuration", () => {
  it("refuses a secure flag that is not a boolean", async () => {
    await assert.rejects(
      () => startModule({ config: { ...DEFAULT_CONFIG, secure: "false" } }),
      {
        errors: [new Error("[Email] Invalid config: secure must be a boolean")],
      },
    );
  });

  it("refuses a default sender that is not a string", async () => {
    await assert.rejects(
      () =>
        startModule({ config: { ...DEFAULT_CONFIG, defaults: { from: 5 } } }),
      {
        errors: [
          new Error("[Email] Invalid config: defaults.from must be a string"),
        ],
      },
    );
  });
});

describe("Inline templates", () => {
  useSandbox();

  it("renders nested variables as JSON, as the brevo implementation does", async () => {
    const sendMailStub = await initializeTransporterWithStubs(sandbox);
    sendMailStub.resolves(createSentMessageInfo(MESSAGE_ID));

    await SendTemplate({
      to: TO_EMAIL,
      subject: SUBJECT,
      template: { type: "text", content: "{{ order }} {{ tags }} {{ none }}" },
      variables: { order: { id: 7 }, tags: ["a", "b"], none: null },
    });

    assert.equal(getFirstMailOptions(sendMailStub).text, '{"id":7} ["a","b"] ');
  });
});
