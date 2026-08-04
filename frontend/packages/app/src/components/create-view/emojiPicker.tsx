/**
 * External dependencies.
 */
import { useState } from "react";
import { Popover } from "@base-ui/react/popover";

/**
 * Internal dependencies.
 */
import type { EmojiPickerProps } from "./types";

const PRESET_EMOJIS = [
  "📋",
  "📁",
  "📊",
  "📈",
  "📉",
  "🗂️",
  "⭐",
  "🔥",
  "🚀",
  "✅",
  "🎯",
  "🏷️",
  "💡",
  "📌",
  "🔖",
  "🗓️",
  "👥",
  "🛠️",
  "🐞",
  "🎨",
  "💰",
  "⏱️",
  "📦",
  "🔔",
];

export function EmojiPicker({ value, onChange }: EmojiPickerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger className="flex size-8 shrink-0 items-center justify-center rounded-md border border-outline-gray-2 text-lg hover:bg-surface-gray-2">
        {value}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner
          className="z-[100]"
          side="bottom"
          align="start"
          sideOffset={6}
        >
          <Popover.Popup className="outline-none">
            <div className="grid grid-cols-6 gap-1 rounded-lg border border-outline-gray-1 bg-surface-modal p-2 shadow-2xl">
              {PRESET_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  className="flex size-8 items-center justify-center rounded text-lg hover:bg-surface-gray-2"
                  onClick={() => {
                    onChange(emoji);
                    setOpen(false);
                  }}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
