const AVATAR_PALETTE = [
  "bg-surface-blue-2 text-ink-blue-4",
  "bg-surface-green-2 text-ink-green-4",
  "bg-surface-amber-2 text-ink-amber-4",
  "bg-surface-red-2 text-ink-red-4",
  "bg-surface-violet-1 text-ink-violet-1",
] as const;

export const getAvatarColors = (seed: string): string => {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_PALETTE[Math.abs(hash) % AVATAR_PALETTE.length];
};

export const getInitials = (name: string): string =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("");
