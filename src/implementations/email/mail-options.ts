import type { SendMailOptions } from "nodemailer";
import type {
  Attachment,
  EmailAddress,
  EmailParams,
  EmailPriority,
} from "@antelopejs/interface-email";

import { getDefaultFrom } from "./transporter";

const REFERENCE_SEPARATOR = " ";
const ADDRESS_SEPARATOR = ", ";
const UNKNOWN_RECIPIENT = "unknown-recipient";

type NodemailerAttachment = NonNullable<SendMailOptions["attachments"]>[number];

function formatAddress(address: EmailAddress): string {
  if (typeof address === "string") {
    return address;
  }
  return address.name ? `"${address.name}" <${address.email}>` : address.email;
}

function formatRequiredAddresses(
  addresses: EmailAddress | EmailAddress[],
): string {
  if (Array.isArray(addresses)) {
    return addresses.map(formatAddress).join(ADDRESS_SEPARATOR);
  }
  return formatAddress(addresses);
}

function formatOptionalAddresses(
  addresses: EmailAddress | EmailAddress[] | undefined,
): string | undefined {
  if (!addresses) {
    return undefined;
  }
  return formatRequiredAddresses(addresses);
}

export function getFirstRecipient(to: EmailAddress | EmailAddress[]): string {
  const firstRecipient = Array.isArray(to) ? to[0] : to;
  if (!firstRecipient) {
    return UNKNOWN_RECIPIENT;
  }
  return typeof firstRecipient === "string"
    ? firstRecipient
    : firstRecipient.email;
}

function mapAttachment(attachment: Attachment): NodemailerAttachment {
  const mappedAttachment: NodemailerAttachment = {
    filename: attachment.filename,
  };
  if (attachment.contentType) {
    mappedAttachment.contentType = attachment.contentType;
  }
  if (attachment.cid) {
    mappedAttachment.cid = attachment.cid;
  }

  if ("content" in attachment && attachment.content instanceof Buffer) {
    mappedAttachment.content = attachment.content;
    return mappedAttachment;
  }

  if ("content" in attachment && "encoding" in attachment) {
    mappedAttachment.content = attachment.content;
    mappedAttachment.encoding = attachment.encoding;
    return mappedAttachment;
  }

  if ("path" in attachment) {
    mappedAttachment.path = attachment.path;
    return mappedAttachment;
  }

  if ("url" in attachment) {
    mappedAttachment.path = attachment.url;
  }

  return mappedAttachment;
}

function mapPriority(
  priority: EmailPriority | undefined,
): SendMailOptions["priority"] {
  return priority;
}

function normalizeReferences(
  references: EmailParams["references"],
): SendMailOptions["references"] {
  if (!references) {
    return undefined;
  }
  if (Array.isArray(references)) {
    return references.join(REFERENCE_SEPARATOR);
  }
  return references;
}

function assignMailOption<Key extends keyof SendMailOptions>(
  mailOptions: SendMailOptions,
  key: Key,
  value: SendMailOptions[Key] | undefined,
): void {
  if (value !== undefined) {
    mailOptions[key] = value;
  }
}

export function buildMailOptions(params: EmailParams): SendMailOptions {
  const mailOptions: SendMailOptions = {
    to: formatRequiredAddresses(params.to),
    subject: params.subject,
  };

  const fromAddress = params.from
    ? formatAddress(params.from)
    : getDefaultFrom();

  assignMailOption(mailOptions, "from", fromAddress);
  assignMailOption(mailOptions, "cc", formatOptionalAddresses(params.cc));
  assignMailOption(mailOptions, "bcc", formatOptionalAddresses(params.bcc));
  assignMailOption(
    mailOptions,
    "replyTo",
    formatOptionalAddresses(params.replyTo),
  );
  assignMailOption(mailOptions, "text", params.text);
  assignMailOption(mailOptions, "html", params.html);
  assignMailOption(mailOptions, "priority", mapPriority(params.priority));
  assignMailOption(mailOptions, "messageId", params.messageId);
  assignMailOption(mailOptions, "inReplyTo", params.inReplyTo);
  assignMailOption(
    mailOptions,
    "references",
    normalizeReferences(params.references),
  );

  if (params.attachments && params.attachments.length > 0) {
    assignMailOption(
      mailOptions,
      "attachments",
      params.attachments.map(mapAttachment),
    );
  }

  return mailOptions;
}
