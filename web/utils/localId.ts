export function createLocalId(
  prefix: string,
  now = Date.now(),
  randomValue = Math.random(),
): string {
  return `${prefix}-${now}-${randomValue.toString(36).slice(2, 8)}`;
}
