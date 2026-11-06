/**
 * A widget filter's trigger text: `"All <noun>s"` when nothing or everything is
 * selected, else `"N <noun>(s) selected"`.
 */
export function filterSummary(
  noun: string,
  selected: number,
  total: number,
): string {
  if (selected === 0 || selected === total) return `All ${noun}s`;
  return `${selected} ${noun}${selected === 1 ? "" : "s"} selected`;
}
