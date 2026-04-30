interface ColorAvatarProps {
  initials: string;
  color: string;
  alt?: string;
}

export function ColorAvatar({ initials, color, alt }: ColorAvatarProps) {
  const isDecorative = !alt;
  return (
    <span
      role={isDecorative ? undefined : "img"}
      aria-label={isDecorative ? undefined : alt}
      aria-hidden={isDecorative ? true : undefined}
      style={{ backgroundColor: color }}
      className="flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-medium uppercase text-ink-white"
    >
      {initials.slice(0, 2)}
    </span>
  );
}
