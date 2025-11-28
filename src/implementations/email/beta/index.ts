import type {
  BatchEmailParams,
  BatchEmailResponse,
  EmailParams,
  EmailResponse,
  ProviderCapabilities,
  TemplateEmailParams,
} from "@ajs/email/beta";

export function Send(params: EmailParams): Promise<EmailResponse> {
  return Promise.resolve({ params } as any);
}

export function SendBatch(
  params: BatchEmailParams,
): Promise<BatchEmailResponse> {
  return Promise.resolve({ params } as any);
}

export function SendTemplate(
  params: TemplateEmailParams,
): Promise<EmailResponse> {
  return Promise.resolve({ params } as any);
}

export function GetCapabilities(): Promise<ProviderCapabilities> {
  return Promise.resolve({} as any);
}
