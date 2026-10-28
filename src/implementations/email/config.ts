import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type nodemailer from "nodemailer";

export const EMAIL_PREFIX = "[Email]";
const ETHEREAL_HOST = "smtp.ethereal.email";
const ETHEREAL_PORT = 587;
const SECURE_PORT = 465;

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

export interface StandardNodemailerConfig extends NodemailerConfig {
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export function createConfigError(message: string): Error {
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

export function validateConfig(config: unknown): ResolvedNodemailerConfig {
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

export function buildEtherealTransportOptions(
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

export function buildStandardTransportOptions(
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
