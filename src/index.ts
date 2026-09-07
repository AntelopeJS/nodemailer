import { ImplementInterface } from "@antelopejs/interface-core";

import { initTransporter } from "./implementations/email";

export async function construct(config: unknown): Promise<void> {
  await initTransporter(config);

  void ImplementInterface(
    await import("@antelopejs/interface-email"),
    await import("./implementations/email"),
  );
}

export function start(): void {}

export function destroy(): void {}

export function stop(): void {}
