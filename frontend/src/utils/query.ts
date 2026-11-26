import type { LocationQueryValue } from "vue-router";

/** The first value of a route query param, or `""` when it's missing. */
export function queryString(
  value: LocationQueryValue | LocationQueryValue[] | undefined,
): string {
  const first = Array.isArray(value) ? value[0] : value;
  return first ?? "";
}

/**
 * Parses a query param holding a JSON array. Returns `[]` when the param is missing,
 * malformed or not an array. Pass `decode` (e.g. `decodeURI`) when the value was encoded
 * before it was written to the URL.
 */
export function parseJSONArrayParam<T>(
  raw: string,
  decode: (value: string) => string = (value) => value,
): T[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(decode(raw));
    return Array.isArray(parsed) ? (parsed as T[]) : [];
  } catch {
    return [];
  }
}

/** The known keys in a comma-separated list, de-duplicated and in order. */
export function parseColumnKeys(
  value: string,
  knownKeys: ReadonlySet<string>,
): string[] {
  const seen = new Set<string>();
  return value.split(",").filter((key) => {
    if (!knownKeys.has(key) || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
