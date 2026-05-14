export function TextCell({ text }: { text?: number | string | null }) {
  return (
    <span className="block truncate text-ink-gray-7 text-base">
      {text || "N/A"}
    </span>
  );
}
