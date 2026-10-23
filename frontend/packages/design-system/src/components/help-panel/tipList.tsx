/**
 * External dependencies.
 */
import { Lightbulb, RightChevron } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { HelpTip } from "./types";

type TipListProps = {
  label: string;
  tips: HelpTip[];
  onOpen: (index: number) => void;
};

export default function TipList({ label, tips, onOpen }: TipListProps) {
  if (tips.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <p className="px-2 pt-2 text-xs font-medium text-ink-gray-5">{label}</p>
      {tips.map((tip, index) => (
        <button
          key={tip.id}
          type="button"
          onClick={() => onOpen(index)}
          className="flex items-center gap-2 rounded-md p-2 text-left text-sm text-ink-gray-8 hover:bg-surface-gray-2"
        >
          <Lightbulb className="size-4 shrink-0 text-ink-gray-5" />
          <span className="flex-1">{tip.title}</span>
          <RightChevron className="size-3.5 shrink-0 text-ink-gray-4" />
        </button>
      ))}
    </div>
  );
}
