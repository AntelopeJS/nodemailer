export interface EmailAddressObject {
    email: string;
    name?: string;
}
export type EmailAddress = string | EmailAddressObject;
export interface BaseAttachment {
    filename: string;
    contentType?: string;
    cid?: string;
    inline?: boolean;
}
export interface BufferAttachment extends BaseAttachment {
    content: Buffer;
}
export interface Base64Attachment extends BaseAttachment {
    content: string;
    encoding: "base64";
}
export interface PathAttachment extends BaseAttachment {
    path: string;
}
export interface UrlAttachment extends BaseAttachment {
    url: string;
}
export type Attachment = BufferAttachment | Base64Attachment | PathAttachment | UrlAttachment;
export interface TrackingOptions {
    opens?: boolean;
    clicks?: boolean;
    trackingDomain?: string;
    disabled?: boolean;
}
export interface ScheduleOptions {
    sendAt?: Date | string;
    timezone?: string;
}
export type EmailPriority = "high" | "normal" | "low";
export interface EmailParams {
    to: EmailAddress | EmailAddress[];
    subject: string;
    text?: string;
    html?: string;
    from?: EmailAddress;
    replyTo?: EmailAddress | EmailAddress[];
    cc?: EmailAddress | EmailAddress[];
    bcc?: EmailAddress | EmailAddress[];
    attachments?: Attachment[];
    messageId?: string;
    inReplyTo?: string;
    references?: string | string[];
    priority?: EmailPriority;
    tracking?: TrackingOptions;
    tags?: string[];
    metadata?: Record<string, string>;
    schedule?: ScheduleOptions;
    providerOptions?: Record<string, unknown>;
}
export interface ProviderTemplate {
    id: string;
    version?: string;
}
export interface InlineTemplate {
    content: string;
    type: "html" | "text";
    engine?: string;
}
export interface TemplateEmailParams {
    to: EmailAddress | EmailAddress[];
    template: ProviderTemplate | InlineTemplate;
    variables?: Record<string, unknown>;
    recipientVariables?: Record<string, Record<string, unknown>>;
    from?: EmailAddress;
    replyTo?: EmailAddress | EmailAddress[];
    cc?: EmailAddress | EmailAddress[];
    bcc?: EmailAddress | EmailAddress[];
    subject?: string;
    attachments?: Attachment[];
    priority?: EmailPriority;
    tracking?: TrackingOptions;
    tags?: string[];
    metadata?: Record<string, string>;
    schedule?: ScheduleOptions;
    providerOptions?: Record<string, unknown>;
}
export interface BatchEmailMessage extends EmailParams {
    batchId?: string;
}
export interface BatchEmailParams {
    messages: BatchEmailMessage[];
    defaults?: Partial<EmailParams>;
    continueOnError?: boolean;
}
export type EmailStatus = "queued" | "sent" | "delivered" | "failed" | "rejected" | "scheduled" | "unknown";
export interface EmailError {
    code: string;
    message: string;
    field?: string;
    retryable?: boolean;
}
export interface EmailResponse {
    success: boolean;
    status: EmailStatus;
    messageId?: string;
    error?: EmailError;
    timestamp?: Date;
    provider?: string;
}
export interface BatchEmailMessageResponse extends EmailResponse {
    batchId?: string;
    index: number;
    recipient: string;
}
export interface BatchEmailResponse {
    success: boolean;
    total: number;
    successful: number;
    failed: number;
    responses: BatchEmailMessageResponse[];
}
export interface ProviderFeatures {
    batch: boolean;
    templates: boolean;
    scheduling: boolean;
    openTracking: boolean;
    clickTracking: boolean;
    inlineAttachments: boolean;
    tags: boolean;
    metadata: boolean;
    priority: boolean;
}
export interface ProviderCapabilities {
    name: string;
    version?: string;
    maxRecipients?: number;
    maxBatchSize?: number;
    maxAttachmentSize?: number;
    maxEmailSize?: number;
    features: ProviderFeatures;
}
export type SendFunction = (params: EmailParams) => Promise<EmailResponse>;
export type SendBatchFunction = (params: BatchEmailParams) => Promise<BatchEmailResponse>;
export type SendTemplateFunction = (params: TemplateEmailParams) => Promise<EmailResponse>;
export type GetCapabilitiesFunction = () => Promise<ProviderCapabilities>;
export declare const Send: (params: EmailParams) => Promise<EmailResponse>;
export declare const SendBatch: (params: BatchEmailParams) => Promise<BatchEmailResponse>;
export declare const SendTemplate: (params: TemplateEmailParams) => Promise<EmailResponse>;
export declare const GetCapabilities: () => Promise<ProviderCapabilities>;
