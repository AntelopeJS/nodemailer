import type SMTPTransport from "nodemailer/lib/smtp-transport";
import type nodemailer from "nodemailer";

export const EMAIL_PREFIX = "[Email]";
const ETHEREAL_HOST = "smtp.ethereal.email";
const ETHEREAL_PORT = 587;
const SECURE_PORT = 465;
const NO_AUTH = new Set([undefined, null, false, 0, ""]);

interface NodemailerAuthConfig {
  user: string;
  pass: string;
}

interface NodemailerDefaultsConfig {
  from?: string;
}

export interface NodemailerConfig {
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

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

function isNumber(value: unknown): value is number {
  return typeof value === "number";
}

export function createConfigError(message: string): Error {
  return new Error(`${EMAIL_PREFIX} ${message}`);
}

function ensureHost(config: NodemailerConfig): string {
  if (!isNonEmptyString(config.host)) {
    throw createConfigError("Missing required config: host");
  }
  return config.host;
}

function ensurePort(config: NodemailerConfig): number {
  if (!isNumber(config.port)) {
    throw createConfigError("Missing required config: port");
  }
  return config.port;
}

/** Refuses a module config that breaks `NodemailerConfig`: core passes the operator's config to `construct` without checking it. */
export function CheckConfig(
  config: NodemailerConfig | undefined,
): asserts config is NodemailerConfig {
  if (typeof config !== "object" || config === null) {
    throw createConfigError("Missing configuration");
  }
  if (config.ethereal === true) {
    return;
  }
  if (config.secure !== undefined && typeof config.secure !== "boolean") {
    throw createConfigError("Invalid config: secure must be a boolean");
  }
  const { defaults, auth } = config;
  const from =
    typeof defaults === "object" && defaults !== null
      ? defaults.from
      : undefined;
  if (from !== undefined && typeof from !== "string") {
    throw createConfigError("Invalid config: defaults.from must be a string");
  }
  if (typeof auth === "object" && auth !== null) {
    if (typeof auth.user !== "string" || auth.user === "") {
      throw createConfigError("Missing required config: auth.user");
    }
    if (typeof auth.pass !== "string" || auth.pass === "") {
      throw createConfigError("Missing required config: auth.pass");
    }
  } else if (!NO_AUTH.has(auth)) {
    throw createConfigError("Missing required config: auth.user");
  }
}

export function validateConfig(
  config: NodemailerConfig,
): ResolvedNodemailerConfig {
  if (config.ethereal === true) {
    return { ...config, ethereal: true };
  }

  return {
    ...config,
    host: ensureHost(config),
    port: ensurePort(config),
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
