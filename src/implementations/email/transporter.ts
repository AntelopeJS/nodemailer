import { Logging } from "@antelopejs/interface-core/logging";
import nodemailer, { type Transporter } from "nodemailer";

import {
  buildEtherealTransportOptions,
  buildStandardTransportOptions,
  createConfigError,
  EMAIL_PREFIX,
  type StandardNodemailerConfig,
} from "./config";

const TRANSPORTER_NOT_INITIALIZED = "Transporter is not initialized";

let transporter: Transporter | null = null;
let defaultFrom: string | undefined;

function setTransporter(nextTransporter: Transporter): void {
  transporter = nextTransporter;
}

function setDefaultFrom(nextDefaultFrom: string | undefined): void {
  defaultFrom = nextDefaultFrom;
}

export function getTransporter(): Transporter {
  if (!transporter) {
    throw createConfigError(TRANSPORTER_NOT_INITIALIZED);
  }
  return transporter;
}

export async function initializeEtherealTransporter(): Promise<void> {
  const testAccount = await nodemailer.createTestAccount();
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

export function getDefaultFrom(): string | undefined {
  return defaultFrom;
}
