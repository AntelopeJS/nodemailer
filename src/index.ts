import { ImplementInterface } from "@ajs/core/beta";
import { initTransporter } from "./implementations/email/beta";

export async function construct(config: unknown): Promise<void> {
  await initTransporter(config);

  void ImplementInterface(
    await import("./interfaces/email/beta"),
    await import("./implementations/email/beta"),
  );
}

export function start(): void {}

export function destroy(): void {}

export function stop(): void {}
