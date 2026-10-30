/**
 * External dependencies.
 */
import { Accordion } from "@base-ui/react/accordion";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@rtcamp/frappe-ui-react";
import { Close } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import TipList from "./tipList";
import type { HelpPanelProps, HelpTip } from "./types";
import { mergeClassNames as cn } from "../../utils";

export default function HelpPanel({
  open,
  onOpenChange,
  pageTips,
  generalTips,
  roles,
  className,
}: HelpPanelProps) {
  const visible = (tips: HelpTip[]) =>
    tips.filter(
      (tip) => !tip.roles || tip.roles.some((role) => roles.includes(role)),
    );
  const visiblePageTips = visible(pageTips);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={onOpenChange}
      modal={false}
      disablePointerDismissal
    >
      <Dialog.Portal>
        <Dialog.Popup
          className={cn(
            "dialog-content fixed bottom-4 z-10 ml-2 flex max-h-[calc(100vh-2rem)] w-90 origin-bottom-left flex-col rounded-xl border border-outline-gray-2 bg-surface-modal shadow-xl outline-none",
            className,
          )}
        >
          <div className="flex items-center gap-1 px-3 pb-2 pt-3">
            <Dialog.Title className="flex-1 px-1 text-sm font-medium text-ink-gray-8">
              Help
            </Dialog.Title>
            <Dialog.Close
              aria-label="Close help"
              render={<Button variant="ghost" icon={Close} />}
            />
          </div>

          <Accordion.Root className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-3">
            {visiblePageTips.length === 0 && (
              <p className="px-2 pt-2 text-sm text-ink-gray-5">
                No tips for this page yet.
              </p>
            )}
            <TipList label="On this page" tips={visiblePageTips} />
            <TipList label="Everywhere" tips={visible(generalTips)} />
          </Accordion.Root>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
