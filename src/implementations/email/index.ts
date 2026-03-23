import { Logging } from "@antelopejs/interface-core/logging";
import type {
  Attachment,
  BatchEmailMessage,
  BatchEmailMessageResponse,
  BatchEmailParams,
  BatchEmailResponse,
  EmailAddress,
  EmailParams,
  EmailPriority,
  EmailResponse,
  InlineTemplate,
  ProviderCapabilities,
  ProviderFeatures,
  ProviderTemplate,
  TemplateEmailParams,
} from "@antelopejs/interface-email";
import nodemailer, {
  type SendMailOptions,
  type SentMessageInfo,
  type Transporter,
} from "nodemailer";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

const PROVIDER_NAME = "nodemailer";
const EMAIL_PREFIX = "[Email]";
const ETHEREAL_HOST = "smtp.ethereal.email";
const ETHEREAL_PORT = 587;
const SECURE_PORT = 465;
const REFERENCE_SEPARATOR = " ";
const ADDRESS_SEPARATOR = ", ";
const UNKNOWN_RECIPIENT = "unknown-recipient";
const SEND_FAILED_CODE = "SEND_FAILED";
const NOT_SUPPORTED_CODE = "NOT_SUPPORTED";
const TRANSPORTER_NOT_INITIALIZED = "Transporter is not initialized";
const TEMPLATE_NOT_SUPPORTED_MESSAGE =
  "Provider templates are not supported by nodemailer. Use inline templates instead.";

interface NodemailerAuthConfig {
  user: string;
  pass: string;
}

interface NodemailerDefaultsConfig {
  from?: string;
}

interface NodemailerConfig {
  host?: string;
  port?: number;
  secure?: boolean;
  auth?: NodemailerAuthConfig;
  defaults?: NodemailerDefaultsConfig;
  ethereal?: boolean;
}

interface StandardNodemailerConfig extends NodemailerConfig {
  host: string;
  port: number;
  ethereal?: false;
}

interface EtherealNodemailerConfig extends NodemailerConfig {
  ethereal: true;
}

type ResolvedNodemailerConfig =
  | StandardNodemailerConfig
  | EtherealNodemailerConfig;

type EtherealAccount = Awaited<ReturnType<typeof nodemailer.createTestAccount>>;

type NodemailerAttachment = NonNullable<SendMailOptions["attachments"]>[number];

interface BatchState {
  failed: number;
  successful: number;
  responses: BatchEmailMessageResponse[];
}

interface MessageIdCarrier {
  messageId?: unknown;
}

let transporter: Transporter | null = null;
let defaultFrom: string | undefined;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function createConfigError(message: string): Error {
  return new Error(`${EMAIL_PREFIX} ${message}`);
}

function parseConfig(config: unknown): NodemailerConfig {
  if (!isRecord(config)) {
    throw createConfigError("Missing configuration");
  }
  return config as NodemailerConfig;
}

function ensureHost(config: NodemailerConfig): string {
  if (!isNonEmptyString(config.host)) {
    throw createConfigError("Missing required config: host");
  }
  return config.host;
}

function ensurePort(config: NodemailerConfig): number {
  if (typeof config.port !== "number") {
    throw createConfigError("Missing required config: port");
  }
  return config.port;
}

function validateAuth(config: NodemailerConfig): void {
  if (!config.auth) {
    return;
  }
  if (!isNonEmptyString(config.auth.user)) {
    throw createConfigError("Missing required config: auth.user");
  }
  if (!isNonEmptyString(config.auth.pass)) {
    throw createConfigError("Missing required config: auth.pass");
  }
}

function validateConfig(config: unknown): ResolvedNodemailerConfig {
  const parsedConfig = parseConfig(config);
  if (parsedConfig.ethereal === true) {
    return { ...parsedConfig, ethereal: true };
  }

  validateAuth(parsedConfig);

  return {
    ...parsedConfig,
    host: ensureHost(parsedConfig),
    port: ensurePort(parsedConfig),
  };
}

function buildEtherealTransportOptions(
  account: EtherealAccount,
): SMTPTransport.Options {
  return {
    host: ETHEREAL_HOST,
    port: ETHEREAL_PORT,
    secure: false,
    auth: {
      user: account.user,
      pass: account.pass,
    },
  };
}

function buildStandardTransportOptions(
  config: StandardNodemailerConfig,
): SMTPTransport.Options {
  const transportOptions: SMTPTransport.Options = {
    host: config.host,
    port: config.port,
    secure: config.secure ?? config.port === SECURE_PORT,
  };
  if (config.auth) {
    transportOptions.auth = config.auth;
  }
  return transportOptions;
}

function setTransporter(nextTransporter: Transporter): void {
  transporter = nextTransporter;
}

function setDefaultFrom(nextDefaultFrom: string | undefined): void {
  defaultFrom = nextDefaultFrom;
}

function getTransporter(): Transporter {
  if (!transporter) {
    throw createConfigError(TRANSPORTER_NOT_INITIALIZED);
  }
  return transporter;
}

async function initializeEtherealTransporter(): Promise<void> {
  const testAccount = await nodemailer.createTestAccount();
  setTransporter(
    nodemailer.createTransport(buildEtherealTransportOptions(testAccount)),
  );
  setDefaultFrom(testAccount.user);
  Logging.Info(`${EMAIL_PREFIX} Ethereal test account: ${testAccount.user}`);
}

function initializeStandardTransporter(config: StandardNodemailerConfig): void {
  setTransporter(
    nodemailer.createTransport(buildStandardTransportOptions(config)),
  );
  setDefaultFrom(config.defaults?.from);
}

export async function initTransporter(config: unknown): Promise<void> {
  const parsedConfig = validateConfig(config);
  if (parsedConfig.ethereal === true) {
    await initializeEtherealTransporter();
    return;
  }
  initializeStandardTransporter(parsedConfig);
}

function formatAddress(address: EmailAddress): string {
  if (typeof address === "string") {
    return address;
  }
  return address.name ? `"${address.name}" <${address.email}>` : address.email;
}

function formatRequiredAddresses(
  addresses: EmailAddress | EmailAddress[],
): string {
  if (Array.isArray(addresses)) {
    return addresses.map(formatAddress).join(ADDRESS_SEPARATOR);
  }
  return formatAddress(addresses);
}

function formatOptionalAddresses(
  addresses: EmailAddress | EmailAddress[] | undefined,
): string | undefined {
  if (!addresses) {
    return undefined;
  }
  return formatRequiredAddresses(addresses);
}

function getFirstRecipient(to: EmailAddress | EmailAddress[]): string {
  const firstRecipient = Array.isArray(to) ? to[0] : to;
  if (!firstRecipient) {
    return UNKNOWN_RECIPIENT;
  }
  return typeof firstRecipient === "string"
    ? firstRecipient
    : firstRecipient.email;
}

function mapAttachment(attachment: Attachment): NodemailerAttachment {
  const mappedAttachment: NodemailerAttachment = {
    filename: attachment.filename,
  };
  if (attachment.contentType) {
    mappedAttachment.contentType = attachment.contentType;
  }
  if (attachment.cid) {
    mappedAttachment.cid = attachment.cid;
  }

  if ("content" in attachment && attachment.content instanceof Buffer) {
    mappedAttachment.content = attachment.content;
    return mappedAttachment;
  }

  if ("content" in attachment && "encoding" in attachment) {
    mappedAttachment.content = attachment.content;
    mappedAttachment.encoding = attachment.encoding;
    return mappedAttachment;
  }

  if ("path" in attachment) {
    mappedAttachment.path = attachment.path;
    return mappedAttachment;
  }

  if ("url" in attachment) {
    mappedAttachment.path = attachment.url;
  }

  return mappedAttachment;
}

function mapPriority(
  priority: EmailPriority | undefined,
): SendMailOptions["priority"] {
  return priority;
}

function normalizeReferences(
  references: EmailParams["references"],
): SendMailOptions["references"] {
  if (!references) {
    return undefined;
  }
  if (Array.isArray(references)) {
    return references.join(REFERENCE_SEPARATOR);
  }
  return references;
}

function assignMailOption<Key extends keyof SendMailOptions>(
  mailOptions: SendMailOptions,
  key: Key,
  value: SendMailOptions[Key] | undefined,
): void {
  if (value !== undefined) {
    mailOptions[key] = value;
  }
}

function buildMailOptions(params: EmailParams): SendMailOptions {
  const mailOptions: SendMailOptions = {
    to: formatRequiredAddresses(params.to),
    subject: params.subject,
  };

  const fromAddress = params.from ? formatAddress(params.from) : defaultFrom;

  assignMailOption(mailOptions, "from", fromAddress);
  assignMailOption(mailOptions, "cc", formatOptionalAddresses(params.cc));
  assignMailOption(mailOptions, "bcc", formatOptionalAddresses(params.bcc));
  assignMailOption(
    mailOptions,
    "replyTo",
    formatOptionalAddresses(params.replyTo),
  );
  assignMailOption(mailOptions, "text", params.text);
  assignMailOption(mailOptions, "html", params.html);
  assignMailOption(mailOptions, "priority", mapPriority(params.priority));
  assignMailOption(mailOptions, "messageId", params.messageId);
  assignMailOption(mailOptions, "inReplyTo", params.inReplyTo);
  assignMailOption(
    mailOptions,
    "references",
    normalizeReferences(params.references),
  );

  if (params.attachments && params.attachments.length > 0) {
    assignMailOption(
      mailOptions,
      "attachments",
      params.attachments.map(mapAttachment),
    );
  }

  return mailOptions;
}

function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

function logPreviewUrl(info: SentMessageInfo): void {
  const previewUrl = nodemailer.getTestMessageUrl(info);
  if (previewUrl) {
    Logging.Info(`${EMAIL_PREFIX} Preview: ${previewUrl}`);
  }
}

function getMessageId(info: SentMessageInfo): string | undefined {
  const infoWithMessageId = info as MessageIdCarrier;
  return typeof infoWithMessageId.messageId === "string"
    ? infoWithMessageId.messageId
    : undefined;
}

function createSuccessResponse(info: SentMessageInfo): EmailResponse {
  const messageId = getMessageId(info);
  return {
    success: true,
    status: "sent",
    ...(messageId !== undefined ? { messageId } : {}),
    timestamp: new Date(),
    provider: PROVIDER_NAME,
  };
}

function createFailureResponse(message: string): EmailResponse {
  return {
    success: false,
    status: "failed",
    error: {
      code: SEND_FAILED_CODE,
      message,
      retryable: true,
    },
    timestamp: new Date(),
    provider: PROVIDER_NAME,
  };
}

function createNotSupportedResponse(): EmailResponse {
  return {
    success: false,
    status: "failed",
    error: {
      code: NOT_SUPPORTED_CODE,
      message: TEMPLATE_NOT_SUPPORTED_MESSAGE,
      retryable: false,
    },
    timestamp: new Date(),
    provider: PROVIDER_NAME,
  };
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

function createTemplateEmailParams(
  params: TemplateEmailParams,
  template: InlineTemplate,
  renderedTemplate: string,
): EmailParams {
  const templateParams: EmailParams = {
    to: params.to,
    subject: params.subject ?? "",
    ...(template.type === "html"
      ? { html: renderedTemplate }
      : { text: renderedTemplate }),
  };
  if (params.from) {
    templateParams.from = params.from;
  }
  if (params.replyTo) {
    templateParams.replyTo = params.replyTo;
  }
  if (params.cc) {
    templateParams.cc = params.cc;
  }
  if (params.bcc) {
    templateParams.bcc = params.bcc;
  }
  if (params.attachments) {
    templateParams.attachments = params.attachments;
  }
  if (params.priority) {
    templateParams.priority = params.priority;
  }
  if (params.tracking) {
    templateParams.tracking = params.tracking;
  }
  if (params.tags) {
    templateParams.tags = params.tags;
  }
  if (params.metadata) {
    templateParams.metadata = params.metadata;
  }
  if (params.schedule) {
    templateParams.schedule = params.schedule;
  }
  if (params.providerOptions) {
    templateParams.providerOptions = params.providerOptions;
  }
  return templateParams;
}

function createBatchMessageResponse(
  result: EmailResponse,
  message: BatchEmailMessage,
  index: number,
  recipient: string,
): BatchEmailMessageResponse {
  return {
    ...result,
    ...(message.batchId !== undefined ? { batchId: message.batchId } : {}),
    index,
    recipient,
  };
}

function createInitialBatchState(): BatchState {
  return {
    failed: 0,
    successful: 0,
    responses: [],
  };
}

function updateBatchState(state: BatchState, result: EmailResponse): void {
  if (result.success) {
    state.successful += 1;
    return;
  }
  state.failed += 1;
}

export async function Send(params: EmailParams): Promise<EmailResponse> {
  try {
    const info = await getTransporter().sendMail(buildMailOptions(params));
    logPreviewUrl(info);
    return createSuccessResponse(info);
  } catch (error) {
    return createFailureResponse(toError(error).message);
  }
}

export async function SendBatch(
  params: BatchEmailParams,
): Promise<BatchEmailResponse> {
  const continueOnError = params.continueOnError ?? true;
  const state = createInitialBatchState();

  for (const [index, message] of params.messages.entries()) {
    const mergedParams: EmailParams = { ...params.defaults, ...message };
    const result = await Send(mergedParams);
    const recipient = getFirstRecipient(mergedParams.to);

    state.responses.push(
      createBatchMessageResponse(result, message, index, recipient),
    );
    updateBatchState(state, result);

    if (!result.success && !continueOnError) {
      break;
    }
  }

  return {
    success: state.failed === 0,
    total: params.messages.length,
    successful: state.successful,
    failed: state.failed,
    responses: state.responses,
  };
}

export async function SendTemplate(
  params: TemplateEmailParams,
): Promise<EmailResponse> {
  if (isProviderTemplate(params.template)) {
    return createNotSupportedResponse();
  }

  const renderedTemplate = renderTemplate(
    params.template,
    params.variables ?? {},
  );
  const templateParams = createTemplateEmailParams(
    params,
    params.template,
    renderedTemplate,
  );

  return Send(templateParams);
}

function getProviderFeatures(): ProviderFeatures {
  return {
    batch: true,
    templates: true,
    scheduling: false,
    openTracking: false,
    clickTracking: false,
    inlineAttachments: true,
    tags: false,
    metadata: false,
    priority: true,
  };
}

export function GetCapabilities(): Promise<ProviderCapabilities> {
  return Promise.resolve({
    name: PROVIDER_NAME,
    features: getProviderFeatures(),
  });
}
