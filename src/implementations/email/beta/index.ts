import type { EmailParams, EmailResponse } from "@ajs/email/beta";

export function send(_email: EmailParams): Promise<EmailResponse> {
  return Promise.resolve({ success: true, message: "Email sent" });
}
