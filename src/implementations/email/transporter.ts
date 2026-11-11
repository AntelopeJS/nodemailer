import { Logging } from "@antelopejs/interface-core/logging";
import nodemailer, { type Transporter } from "nodemailer";
import type SMTPPool from "nodemailer/lib/smtp-pool";

import {
  buildEtherealTransportOptions,
  buildStandardTransportOptions,
  createConfigError,
  EMAIL_PREFIX,
  type EtherealAccount,
  type StandardNodemailerConfig,
} from "./config";

type SMTPTransporter = Transporter<SMTPPool.SentMessageInfo>;

const TRANSPORTER_NOT_INITIALIZED = "Transporter is not initialized";
const ETHEREAL_ACCOUNT_TIMEOUT_MS = 10_000;

let transporter: SMTPTransporter | null = null;
let defaultFrom: string | undefined;

function setTransporter(nextTransporter: SMTPTransporter): void {
  transporter = nextTransporter;
}

function setDefaultFrom(nextDefaultFrom: string | undefined): void {
  defaultFrom = nextDefaultFrom;
}

export function getTransporter(): SMTPTransporter {
  if (!transporter) {
    throw createConfigError(TRANSPORTER_NOT_INITIALIZED);
  }
  return transporter;
}

async function createTestAccountWithin(
  timeoutMs: number,
): Promise<EtherealAccount> {
  let timer: NodeJS.Timeout | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`no answer within ${timeoutMs} ms`));
    }, timeoutMs);
  });
  try {
    return await Promise.race([nodemailer.createTestAccount(), timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/** Creates the Ethereal transporter. When the account API fails or gives no answer within {@link ETHEREAL_ACCOUNT_TIMEOUT_MS}, it logs one warning and leaves the module without a transporter, so `Send` reports a failure instead of the start hanging. */
export async function initializeEtherealTransporter(): Promise<void> {
  let testAccount: EtherealAccount;
  try {
    testAccount = await createTestAccountWithin(ETHEREAL_ACCOUNT_TIMEOUT_MS);
  } catch (error) {
    closeTransporter();
    Logging.Warn(
      `${EMAIL_PREFIX} Ethereal test account unavailable, starting without a transporter: ${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }
  setTransporter(
    nodemailer.createTransport(buildEtherealTransportOptions(testAccount)),
  );
  setDefaultFrom(testAccount.user);
  Logging.Info(`${EMAIL_PREFIX} Ethereal test account: ${testAccount.user}`);
}

export function initializeStandardTransporter(
  config: StandardNodemailerConfig,
): void {
  setTransporter(
    nodemailer.createTransport(buildStandardTransportOptions(config)),
  );
  setDefaultFrom(config.defaults?.from);
}

export function closeTransporter(): void {
  transporter?.close();
  transporter = null;
}

export function getDefaultFrom(): string | undefined {
  return defaultFrom;
}
