import { ImplementInterface } from "@antelopejs/interface-core";

import {
  CheckConfig,
  type NodemailerConfig,
} from "./implementations/email/config";
import { initTransporter } from "./implementations/email";
import { closeTransporter } from "./implementations/email/transporter";

export async function construct(
  config: NodemailerConfig | undefined,
): Promise<void> {
  CheckConfig(config);
  await initTransporter(config);

  void ImplementInterface(
    await import("@antelopejs/interface-email"),
    await import("./implementations/email"),
  );
}

export function start(): void {}

export function destroy(): void {
  closeTransporter();
}

export function stop(): void {}
