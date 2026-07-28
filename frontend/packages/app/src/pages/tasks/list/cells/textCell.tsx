export function TextCell({ text }: { text?: number | string | null }) {
  return (
    <span className="block truncate text-ink-gray-6 text-base">
      {text === null || text === undefined || text === "" ? "N/A" : text}
    </span>
  );
}
