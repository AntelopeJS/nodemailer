import type {
  EmailParams,
  InlineTemplate,
  ProviderTemplate,
  TemplateEmailParams,
} from "@antelopejs/interface-email";

export function renderTemplate(
  template: InlineTemplate,
  variables: NonNullable<TemplateEmailParams["variables"]>,
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

export function isProviderTemplate(
  template: ProviderTemplate | InlineTemplate,
): template is ProviderTemplate {
  return "id" in template;
}

export function createTemplateEmailParams(
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
