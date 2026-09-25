/** "42 min left", or "4:05 left" in the last ten minutes. */
export function formatTimeLeft(ms: number): string {
  if (ms <= 0) {
    return 'Expired';
  }
  const totalSeconds = Math.ceil(ms / 1000);
  if (totalSeconds < 600) {
    const m = Math.floor(totalSeconds / 60);
    const s = String(totalSeconds % 60).padStart(2, '0');
    return `${m}:${s} left`;
  }
  return `${Math.ceil(totalSeconds / 60)} min left`;
}
