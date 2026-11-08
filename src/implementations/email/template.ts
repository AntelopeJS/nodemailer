import type {
  EmailParams,
  InlineTemplate,
  JsonObject,
  JsonValue,
  ProviderTemplate,
  TemplateEmailParams,
} from "@antelopejs/interface-email";

const PLACEHOLDER = /\{\{([^{}]*)\}\}/g;

function isStructured(value: JsonValue): value is JsonValue[] | JsonObject {
  return typeof value === "object" && value !== null;
}

function renderValue(value: JsonValue | undefined): string {
  if (value === undefined || value === null) {
    return "";
  }
  return isStructured(value) ? JSON.stringify(value) : String(value);
}

export function renderTemplate(
  template: InlineTemplate,
  variables: NonNullable<TemplateEmailParams["variables"]>,
): string {
  return template.content.replace(PLACEHOLDER, (placeholder, raw: string) => {
    const name = raw.trim();
    return Object.hasOwn(variables, name)
      ? renderValue(variables[name])
      : placeholder;
  });
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
