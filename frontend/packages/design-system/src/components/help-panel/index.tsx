/**
 * External dependencies.
 */
import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Button } from "@rtcamp/frappe-ui-react";
import {
  ArrowLeft,
  ArrowUpRight,
  Close,
  LeftChevron,
  RightChevron,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import TipList from "./tipList";
import type { HelpPanelProps, HelpTip, OpenTips } from "./types";
import { mergeClassNames as cn } from "../../utils";
import { WIKI_BASE } from "../info-hover-card/constants";

function HelpContent({
  pageTips,
  generalTips,
}: {
  pageTips: HelpTip[];
  generalTips: HelpTip[];
}) {
  const [opened, setOpened] = useState<OpenTips | null>(null);
  const [direction, setDirection] = useState<"forward" | "back">();
  const tip = opened && opened.tips[opened.index];

  const show = (next: OpenTips | null, to: "forward" | "back") => {
    setOpened(next);
    setDirection(to);
  };

  return (
    <>
      <div className="flex items-center gap-1 px-3 pb-2 pt-3">
        {opened && (
          <Button
            variant="ghost"
            aria-label="Back to help topics"
            icon={ArrowLeft}
            onClick={() => show(null, "back")}
          />
        )}
        <Dialog.Title className="flex-1 px-1 text-sm font-medium text-ink-gray-8">
          Help
        </Dialog.Title>
        <Dialog.Close
          aria-label="Close help"
          render={<Button variant="ghost" icon={Close} />}
        />
      </div>

      <div
        key={tip?.id ?? "list"}
        className={cn(
          "flex min-h-0 flex-1 flex-col overflow-y-auto motion-reduce:animate-none",
          direction === "forward" && "animate-fade-left",
          direction === "back" && "animate-fade-right",
          tip ? "gap-3 px-4 pb-4" : "gap-2 px-2 pb-3",
        )}
      >
        {tip ? (
          <>
            <p className="text-base font-medium text-ink-gray-8">{tip.title}</p>
            <p className="text-sm leading-relaxed text-ink-gray-6">
              {tip.body}
            </p>
          </>
        ) : (
          <>
            {pageTips.length === 0 && (
              <p className="px-2 pt-2 text-sm text-ink-gray-5">
                No tips for this page yet.
              </p>
            )}
            <TipList
              label="On this page"
              tips={pageTips}
              onOpen={(index) => show({ tips: pageTips, index }, "forward")}
            />
            <TipList
              label="Everywhere"
              tips={generalTips}
              onOpen={(index) => show({ tips: generalTips, index }, "forward")}
            />
          </>
        )}
      </div>

      {opened && tip && (
        <div className="mx-4 mb-4 flex shrink-0 flex-col items-center gap-2 border-t border-outline-gray-1 pt-3">
          {tip.wiki && (
            <a
              href={`${WIKI_BASE}/${tip.wiki}`}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-1 text-sm text-ink-gray-7 underline underline-offset-2 hover:text-ink-gray-9"
            >
              Learn more in the wiki <ArrowUpRight className="size-3.5" />
            </a>
          )}
          <div className="flex w-full items-center justify-between">
            <Button
              variant="ghost"
              label="Previous"
              iconLeft={LeftChevron}
              className={cn(opened.index === 0 && "invisible")}
              onClick={() =>
                show({ ...opened, index: opened.index - 1 }, "back")
              }
            />
            <span className="text-xs text-ink-gray-5">
              {opened.index + 1} of {opened.tips.length}
            </span>
            <Button
              variant="ghost"
              label="Next"
              iconRight={RightChevron}
              className={cn(
                opened.index === opened.tips.length - 1 && "invisible",
              )}
              onClick={() =>
                show({ ...opened, index: opened.index + 1 }, "forward")
              }
            />
          </div>
        </div>
      )}
    </>
  );
}

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
            "dialog-content fixed bottom-4 z-10 ml-2 flex h-140 max-h-[calc(100vh-2rem)] w-90 origin-bottom-left flex-col rounded-xl border border-outline-gray-2 bg-surface-modal shadow-xl outline-none",
            className,
          )}
        >
          <HelpContent
            key={visiblePageTips.map((tip) => tip.id).join()}
            pageTips={visiblePageTips}
            generalTips={visible(generalTips)}
          />
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
