const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);
const SCHEME_PREFIX = /^([a-z][a-z0-9+.-]*):/i;

/** Whether `value` starts with a scheme (`https://`, `mailto:`), not a host and port. */
function hasExplicitScheme(value: string): boolean {
  const match = SCHEME_PREFIX.exec(value);
  if (!match) return false;
  if (match[1].toLowerCase() === "mailto") return true;
  return value.startsWith(`${match[0]}//`);
}

/**
 * A user-entered URL made safe for an external `href`, or `undefined` when it can't be.
 * A value without a scheme (`example.com`, `localhost:3000/x`) gets `https://`, so it
 * doesn't resolve inside the app; schemes other than http, https and mailto are rejected.
 */
export function safeExternalUrl(value?: string | null): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const candidate = hasExplicitScheme(trimmed)
    ? trimmed
    : `https://${trimmed.replace(/^\/+/, "")}`;
  try {
    const url = new URL(candidate);
    return SAFE_URL_PROTOCOLS.has(url.protocol) ? url.href : undefined;
  } catch {
    return undefined;
  }
}
