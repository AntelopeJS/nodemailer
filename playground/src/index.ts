import Logging from "@antelopejs/interface-core/logging";
import {
  GetCapabilities,
  Send,
  SendBatch,
  SendTemplate,
} from "@antelopejs/interface-email";

export function construct(_config: unknown): void {}

export async function start(): Promise<void> {
  Logging.Info("=== Email Playground ===\n");

  // Test GetCapabilities
  Logging.Info("--- GetCapabilities ---");
  const caps = await GetCapabilities();
  Logging.Info(`Provider: ${caps.name}`);
  Logging.Debug("Features:", caps.features);

  // Test Send
  Logging.Info("\n--- Send ---");
  const result = await Send({
    to: "test@example.com",
    subject: "Test Email from AntelopeJS",
    text: "Hello from AntelopeJS!",
    html: "<h1>Hello!</h1><p>This is a test email from <strong>AntelopeJS</strong>.</p>",
  });
  Logging.Info(`Success: ${result.success}, MessageId: ${result.messageId}`);

  // Test SendTemplate (inline)
  Logging.Info("\n--- SendTemplate (inline) ---");
  const templateResult = await SendTemplate({
    to: "user@example.com",
    template: {
      content:
        "<h1>Hello {{ name }}!</h1><p>Welcome to {{ app }}. Your account is ready.</p>",
      type: "html",
    },
    variables: { name: "John", app: "AntelopeJS" },
    subject: "Welcome to AntelopeJS!",
  });
  Logging.Info(`Success: ${templateResult.success}`);

  // Test SendTemplate (provider - should fail)
  Logging.Info("\n--- SendTemplate (provider - expected to fail) ---");
  const providerResult = await SendTemplate({
    to: "user@example.com",
    template: { id: "welcome-template" },
    subject: "Test",
  });
  Logging.Info(
    `Success: ${providerResult.success}, Error: ${providerResult.error?.code}`,
  );

  // Test SendBatch
  Logging.Info("\n--- SendBatch ---");
  const batchResult = await SendBatch({
    messages: [
      {
        to: "user1@example.com",
        subject: "Batch Email 1",
        text: "Hello User 1!",
        batchId: "batch-1",
      },
      {
        to: "user2@example.com",
        subject: "Batch Email 2",
        text: "Hello User 2!",
        batchId: "batch-2",
      },
      {
        to: "user3@example.com",
        subject: "Batch Email 3",
        text: "Hello User 3!",
        batchId: "batch-3",
      },
    ],
  });
  Logging.Info(
    `Total: ${batchResult.total}, Success: ${batchResult.successful}, Failed: ${batchResult.failed}`,
  );

  Logging.Info("\n=== Done ===");
  Logging.Info(
    "Check the preview URLs above to view the emails in your browser!",
  );
}

export function destroy(): void {}

export function stop(): void {}
