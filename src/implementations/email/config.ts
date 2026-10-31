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

function isFields(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isOptionalFlag(value: unknown): value is boolean | undefined {
  return value === undefined || typeof value === "boolean";
}

function isOptionalText(value: unknown): value is string | undefined {
  return value === undefined || typeof value === "string";
}

function isAuth(value: unknown): value is NodemailerAuthConfig {
  return (
    isFields(value) &&
    isNonEmptyString(value.user) &&
    isNonEmptyString(value.pass)
  );
}

function isUnset(value: unknown): value is false | 0 | "" | null | undefined {
  return (
    value === undefined ||
    value === null ||
    value === false ||
    value === 0 ||
    value === ""
  );
}

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

/** The module config, read field by field from the raw value core passes to `construct`. */
export function ReadConfig(raw: unknown): NodemailerConfig {
  if (!isFields(raw)) {
    throw createConfigError("Missing configuration");
  }
  if (raw.ethereal === true) {
    return { ethereal: true };
  }
  const { host, port, secure, auth, defaults } = raw;
  if (!isOptionalFlag(secure)) {
    throw createConfigError("Invalid config: secure must be a boolean");
  }
  const from = isFields(defaults) ? defaults.from : undefined;
  if (!isOptionalText(from)) {
    throw createConfigError("Invalid config: defaults.from must be a string");
  }
  const config: NodemailerConfig = {};
  if (isNonEmptyString(host)) config.host = host;
  if (isNumber(port)) config.port = port;
  if (secure !== undefined) config.secure = secure;
  if (isFields(defaults)) config.defaults = from === undefined ? {} : { from };
  if (isAuth(auth)) {
    config.auth = auth;
  } else if (!isUnset(auth)) {
    const user = isFields(auth) ? auth.user : undefined;
    throw createConfigError(
      isNonEmptyString(user)
        ? "Missing required config: auth.pass"
        : "Missing required config: auth.user",
    );
  }
  return config;
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
