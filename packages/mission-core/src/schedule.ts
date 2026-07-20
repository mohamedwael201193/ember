export function slotAt(startAt: number, cadenceSeconds: number, index: number): number {
  if (
    !Number.isSafeInteger(startAt) ||
    !Number.isSafeInteger(cadenceSeconds) ||
    !Number.isSafeInteger(index)
  ) {
    throw new TypeError("schedule values must be safe integers");
  }
  if (cadenceSeconds <= 0 || index < 0) throw new RangeError("invalid schedule values");
  return startAt + cadenceSeconds * index;
}

export function slotIndexAt(
  startAt: number,
  cadenceSeconds: number,
  at: number
): number | undefined {
  if (cadenceSeconds <= 0) throw new RangeError("cadenceSeconds must be positive");
  if (at < startAt) return undefined;
  return Math.floor((at - startAt) / cadenceSeconds);
}

export function expectedSlots(
  startAt: number,
  cadenceSeconds: number,
  now: number,
  graceSeconds = 0
): number[] {
  const latest = slotIndexAt(startAt, cadenceSeconds, now - graceSeconds);
  if (latest === undefined) return [];
  return Array.from({ length: latest + 1 }, (_, index) => slotAt(startAt, cadenceSeconds, index));
}
