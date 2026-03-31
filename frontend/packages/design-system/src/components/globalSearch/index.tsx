/**
 * External dependencies
 */
import { Autocomplete } from "@base-ui/react/autocomplete";
import { Dialog } from "@base-ui/react/dialog";
import { ScrollArea } from "@base-ui/react/scroll-area";
import { ArrowDown, ArrowUp, CornerDownLeft } from "lucide-react";

interface GlobalSearchProps {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  items: {
    value: string;
    label: string;
  }[];
}

export default function GlobalSearch({
  open,
  onOpenChange,
  items,
}: GlobalSearchProps) {
  function handleItemClick() {
    onOpenChange(false);
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Backdrop className="dialog-backdrop fixed inset-0 bg-black-overlay-200 backdrop-filter backdrop-blur-md overflow-y-auto z-11">
          <Dialog.Viewport className="flex min-h-screen flex-col items-center px-4 py-4 text-center">
            <Dialog.Popup className="max-w-xl dialog-content inline-block w-full transform overflow-hidden rounded-xl bg-surface-modal text-left align-middle shadow-xl">
              <Autocomplete.Root
                open
                inline
                items={items}
                autoHighlight="always"
                keepHighlight
                limit={5}
              >
                <Autocomplete.Input
                  placeholder="Search or type a command"
                  className="w-full px-4 py-3 text-base text-ink-gray-8 placeholder:text-ink-gray-4 border-b border-outline-gray-modals focus:outline-none"
                />

                <ScrollArea.Root className="flex-1 overflow-hidden">
                  <ScrollArea.Viewport className="max-h-80">
                    <ScrollArea.Content className="py-2">
                      <Autocomplete.List>
                        {(item) => (
                          <Autocomplete.Item
                            key={item.value}
                            value={item}
                            onClick={handleItemClick}
                            className="flex items-center justify-between mx-2 px-3 py-2.5 rounded-lg cursor-pointer data-highlighted:bg-surface-gray-2 outline-none"
                          >
                            <span className="text-base text-ink-gray-8">
                              {item.label}
                            </span>
                          </Autocomplete.Item>
                        )}
                      </Autocomplete.List>
                      <Autocomplete.Empty>
                        <p className="py-4 text-center text-sm text-ink-gray-4">
                          No results found.
                        </p>
                      </Autocomplete.Empty>
                    </ScrollArea.Content>
                  </ScrollArea.Viewport>
                  <ScrollArea.Scrollbar className="flex w-1.5 touch-none select-none p-0.5">
                    <ScrollArea.Thumb className="relative flex-1 rounded-full bg-gray-200 dark:bg-white/20" />
                  </ScrollArea.Scrollbar>
                </ScrollArea.Root>
                <div className="flex items-center gap-4 px-4 py-2.5 border-t border-outline-gray-modals text-xs text-gray-400">
                  <div className="flex items-center gap-1.5">
                    <kbd className="inline-flex items-center justify-center rounded p-1 bg-surface-gray-3 ">
                      <ArrowUp className="text-ink-gray-6" />
                    </kbd>
                    <kbd className="inline-flex items-center justify-center rounded p-1 bg-surface-gray-3 ">
                      <ArrowDown className="text-ink-gray-6" />
                    </kbd>
                    <span>to navigate</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="inline-flex items-center justify-center rounded p-1 bg-surface-gray-3 ">
                      <CornerDownLeft className="text-ink-gray-6" />
                    </kbd>
                    <span>to select</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <kbd className="inline-flex items-center justify-center rounded p-1 bg-surface-gray-3 ">
                      <span className="text-ink-gray-6 text-2xs"> esc </span>
                    </kbd>
                    <span>to close</span>
                  </div>
                </div>
              </Autocomplete.Root>
            </Dialog.Popup>
          </Dialog.Viewport>
        </Dialog.Backdrop>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
