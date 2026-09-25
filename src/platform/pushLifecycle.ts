// Session store calls cleanup before clearing auth. Kept separate to avoid API/store cycles.
let cleanup: (() => Promise<void>) | undefined;
export function setPushCleanup(callback: () => Promise<void>) {
  cleanup = callback;
  return () => {
    if (cleanup === callback) cleanup = undefined;
  };
}
export async function cleanupPushSession() {
  await cleanup?.();
}
