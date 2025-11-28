import type {
  Attachment,
  BatchEmailMessageResponse,
  BatchEmailParams,
  BatchEmailResponse,
  EmailAddress,
  EmailParams,
  EmailPriority,
  EmailResponse,
  InlineTemplate,
  ProviderCapabilities,
  ProviderTemplate,
  TemplateEmailParams,
} from "@ajs/email/beta";
import Logging from "@ajs/logging/beta";
import nodemailer, { type Transporter } from "nodemailer";

// =============================================================================
// CONFIG
// =============================================================================

interface NodemailerConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: {
    user: string;
    pass: string;
  };
  defaults?: {
    from?: string;
  };
  ethereal?: boolean;
}

let transporter: Transporter;
let defaultFrom: string | undefined;

function validateConfig(config: unknown): NodemailerConfig {
  if (!config || typeof config !== "object") {
    throw new Error("[Email] Missing configuration");
  }

  const cfg = config as NodemailerConfig;

  if (cfg.ethereal) {
    return cfg;
  }

  if (!cfg.host) {
    throw new Error("[Email] Missing required config: host");
  }
  if (cfg.port === undefined) {
    throw new Error("[Email] Missing required config: port");
  }
  if (cfg.auth) {
    if (!cfg.auth.user) {
      throw new Error("[Email] Missing required config: auth.user");
    }
    if (!cfg.auth.pass) {
      throw new Error("[Email] Missing required config: auth.pass");
    }
  }

  return cfg;
}

export async function initTransporter(config: unknown): Promise<void> {
  const cfg = validateConfig(config);

  if (cfg.ethereal) {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    defaultFrom = testAccount.user;
    Logging.Info(`[Email] Ethereal test account: ${testAccount.user}`);
  } else {
    transporter = nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure ?? cfg.port === 465,
      auth: cfg.auth,
    });
    defaultFrom = cfg.defaults?.from;
  }
}

// =============================================================================
// HELPERS
// =============================================================================

function formatAddress(addr: EmailAddress): string {
  if (typeof addr === "string") {
    return addr;
  }
  return addr.name ? `"${addr.name}" <${addr.email}>` : addr.email;
}

function formatAddresses(
  addrs: EmailAddress | EmailAddress[] | undefined,
): string | undefined {
  if (!addrs) return undefined;
  if (Array.isArray(addrs)) {
    return addrs.map(formatAddress).join(", ");
  }
  return formatAddress(addrs);
}

function getFirstRecipient(to: EmailAddress | EmailAddress[]): string {
  const first = Array.isArray(to) ? to[0] : to;
  return typeof first === "string" ? first : first.email;
}

interface NodemailerAttachment {
  filename: string;
  contentType?: string;
  cid?: string;
  content?: Buffer | string;
  encoding?: string;
  path?: string;
  href?: string;
}

function mapAttachment(att: Attachment): NodemailerAttachment {
  const base: NodemailerAttachment = {
    filename: att.filename,
    contentType: att.contentType,
    cid: att.cid,
  };

  if ("content" in att && att.content instanceof Buffer) {
    base.content = att.content;
  } else if (
    "content" in att &&
    "encoding" in att &&
    att.encoding === "base64"
  ) {
    base.content = att.content;
    base.encoding = "base64";
  } else if ("path" in att) {
    base.path = att.path;
  } else if ("url" in att) {
    base.href = att.url;
  }

  return base;
}

function mapPriority(
  priority: EmailPriority | undefined,
): "high" | "normal" | "low" | undefined {
  return priority;
}

function renderTemplate(
  template: InlineTemplate,
  variables: Record<string, unknown>,
): string {
  let content = template.content;
  for (const [key, value] of Object.entries(variables)) {
    content = content.replace(
      new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "g"),
      String(value ?? ""),
    );
  }
  return content;
}

function isProviderTemplate(
  template: ProviderTemplate | InlineTemplate,
): template is ProviderTemplate {
  return "id" in template;
}

// =============================================================================
// INTERFACE FUNCTIONS
// =============================================================================

export async function Send(params: EmailParams): Promise<EmailResponse> {
  try {
    const mailOptions: nodemailer.SendMailOptions = {
      from: params.from ? formatAddress(params.from) : defaultFrom,
      to: formatAddresses(params.to),
      cc: formatAddresses(params.cc),
      bcc: formatAddresses(params.bcc),
      replyTo: formatAddresses(params.replyTo),
      subject: params.subject,
      text: params.text,
      html: params.html,
      priority: mapPriority(params.priority),
      messageId: params.messageId,
      inReplyTo: params.inReplyTo,
      references: Array.isArray(params.references)
        ? params.references.join(" ")
        : params.references,
      attachments: params.attachments?.map(mapAttachment),
    };

    const info = await transporter.sendMail(mailOptions);

    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
      Logging.Info(`[Email] Preview: ${previewUrl}`);
    }

    return {
      success: true,
      status: "sent",
      messageId: info.messageId,
      timestamp: new Date(),
      provider: "nodemailer",
    };
  } catch (err) {
    const error = err as Error;
    return {
      success: false,
      status: "failed",
      error: {
        code: "SEND_FAILED",
        message: error.message,
        retryable: true,
      },
      timestamp: new Date(),
      provider: "nodemailer",
    };
  }
}

export async function SendBatch(
  params: BatchEmailParams,
): Promise<BatchEmailResponse> {
  const responses: BatchEmailMessageResponse[] = [];
  let successful = 0;
  let failed = 0;
  const continueOnError = params.continueOnError ?? true;

  for (let i = 0; i < params.messages.length; i++) {
    const message = params.messages[i];
    const mergedParams: EmailParams = { ...params.defaults, ...message };

    const result = await Send(mergedParams);
    const recipient = getFirstRecipient(mergedParams.to);

    responses.push({
      ...result,
      batchId: message.batchId,
      index: i,
      recipient,
    });

    if (result.success) {
      successful++;
    } else {
      failed++;
      if (!continueOnError) break;
    }
  }

  return {
    success: failed === 0,
    total: params.messages.length,
    successful,
    failed,
    responses,
  };
}

export async function SendTemplate(
  params: TemplateEmailParams,
): Promise<EmailResponse> {
  if (isProviderTemplate(params.template)) {
    return {
      success: false,
      status: "failed",
      error: {
        code: "NOT_SUPPORTED",
        message:
          "Provider templates are not supported by nodemailer. Use inline templates instead.",
        retryable: false,
      },
      timestamp: new Date(),
      provider: "nodemailer",
    };
  }

  const template = params.template;
  const variables = params.variables ?? {};
  const rendered = renderTemplate(template, variables);

  const emailParams: EmailParams = {
    to: params.to,
    subject: params.subject ?? "",
    from: params.from,
    replyTo: params.replyTo,
    cc: params.cc,
    bcc: params.bcc,
    attachments: params.attachments,
    priority: params.priority,
    ...(template.type === "html" ? { html: rendered } : { text: rendered }),
  };

  return Send(emailParams);
}

export function GetCapabilities(): Promise<ProviderCapabilities> {
  return Promise.resolve({
    name: "nodemailer",
    features: {
      batch: true,
      templates: true,
      scheduling: false,
      openTracking: false,
      clickTracking: false,
      webhooks: false,
      inlineAttachments: true,
      tags: false,
      metadata: false,
      priority: true,
    },
  });
}
