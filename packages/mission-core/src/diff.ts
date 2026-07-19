export function missedSlots(expected: readonly number[], paid: ReadonlySet<number>): number[] {
  return expected.filter((slot) => !paid.has(slot));
}
