import type {
  BatchEmailParams,
  BatchEmailResponse,
  EmailParams,
  EmailResponse,
  ProviderCapabilities,
  ProviderFeatures,
  TemplateEmailParams,
} from "@antelopejs/interface-email";

import {
  createConfigError,
  isObject,
  type NodemailerConfig,
  validateConfig,
} from "./config";
import { buildMailOptions, getFirstRecipient } from "./mail-options";
import {
  createBatchMessageResponse,
  createFailureResponse,
  createInitialBatchState,
  createNotSupportedResponse,
  createSuccessResponse,
  logPreviewUrl,
  PROVIDER_NAME,
  updateBatchState,
} from "./responses";
import {
  createTemplateEmailParams,
  isProviderTemplate,
  renderTemplate,
} from "./template";
import {
  getTransporter,
  initializeEtherealTransporter,
  initializeStandardTransporter,
} from "./transporter";

export async function initTransporter(config: unknown): Promise<void> {
  if (!isObject(config)) {
    throw createConfigError("Missing configuration");
  }
  const parsedConfig = validateConfig(config as NodemailerConfig);
  if (parsedConfig.ethereal === true) {
    await initializeEtherealTransporter();
    return;
  }
  initializeStandardTransporter(parsedConfig);
}

export async function Send(params: EmailParams): Promise<EmailResponse> {
  try {
    const info = await getTransporter().sendMail(buildMailOptions(params));
    logPreviewUrl(info);
    return createSuccessResponse(info);
  } catch (error) {
    return createFailureResponse(
      error instanceof Error ? error.message : String(error),
    );
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
