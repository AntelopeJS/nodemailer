import { ImplementInterface } from "@ajs/core/beta";

export async function construct(): Promise<void> {
  void ImplementInterface(
    await import("./interfaces/email/beta"),
    await import("./implementations/email/beta"),
  );
}

export function start(): void {}

export function destroy(): void {}

export function stop(): void {}
