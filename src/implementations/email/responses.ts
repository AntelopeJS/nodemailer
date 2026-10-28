import { Logging } from "@antelopejs/interface-core/logging";
import nodemailer, { type SentMessageInfo } from "nodemailer";
import type {
  BatchEmailMessage,
  BatchEmailMessageResponse,
  EmailResponse,
} from "@antelopejs/interface-email";

import { EMAIL_PREFIX } from "./config";

export const PROVIDER_NAME = "nodemailer";
const SEND_FAILED_CODE = "SEND_FAILED";
const NOT_SUPPORTED_CODE = "NOT_SUPPORTED";
const TEMPLATE_NOT_SUPPORTED_MESSAGE =
  "Provider templates are not supported by nodemailer. Use inline templates instead.";

interface BatchState {
  failed: number;
  successful: number;
  responses: BatchEmailMessageResponse[];
}

interface MessageIdCarrier {
  messageId?: unknown;
}

export function toError(error: unknown): Error {
  if (error instanceof Error) {
    return error;
  }
  return new Error(String(error));
}

export function logPreviewUrl(info: SentMessageInfo): void {
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

export function createSuccessResponse(info: SentMessageInfo): EmailResponse {
  const messageId = getMessageId(info);
  return {
    success: true,
    status: "sent",
    ...(messageId !== undefined ? { messageId } : {}),
    timestamp: new Date(),
    provider: PROVIDER_NAME,
  };
}

export function createFailureResponse(message: string): EmailResponse {
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

export function createNotSupportedResponse(): EmailResponse {
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

export function createBatchMessageResponse(
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

export function createInitialBatchState(): BatchState {
  return {
    failed: 0,
    successful: 0,
    responses: [],
  };
}

export function updateBatchState(
  state: BatchState,
  result: EmailResponse,
): void {
  if (result.success) {
    state.successful += 1;
    return;
  }
  state.failed += 1;
}
