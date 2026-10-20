/**
 * External dependencies.
 */
import { Popover } from "@base-ui/react/popover";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";
import { Info } from "lucide-react";

/**
 * Internal dependencies.
 */
import { WIKI_BASE } from "./constants";
import type { InfoHoverCardProps } from "./types";
import { mergeClassNames as cn } from "../../utils";

/** A popover rather than a tooltip, so the wiki link inside stays clickable. */
export default function InfoHoverCard({ help, className }: InfoHoverCardProps) {
  return (
    <span className="inline-flex shrink-0">
      <Popover.Root>
        <Popover.Trigger
          openOnHover
          delay={300}
          closeDelay={150}
          aria-label={`About ${help.title}`}
          className={cn(
            "inline-flex size-3 shrink-0 items-center justify-center rounded text-ink-gray-4 transition-colors hover:text-ink-gray-7 focus-visible:outline-2 focus-visible:outline-outline-gray-3 data-popup-open:text-ink-gray-7",
            className,
          )}
        >
          <Info size={10} />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Positioner
            className="z-100"
            side="bottom"
            align="start"
            sideOffset={8}
          >
            <Popover.Popup className="flex w-72 flex-col gap-3 rounded-xl bg-surface-modal p-3 text-left shadow-2xl outline-none animate-fade-in">
              <div className="flex flex-col gap-1">
                <Popover.Title className="text-base font-medium text-ink-gray-7">
                  {help.title}
                </Popover.Title>
                <Popover.Description className="text-sm leading-snug text-ink-gray-6">
                  {help.summary}
                </Popover.Description>
              </div>
              {help.formula && (
                <p className="rounded-md bg-surface-gray-2 px-2 py-1.5 text-xs leading-snug text-ink-gray-8">
                  {help.formula}
                </p>
              )}
              {help.details && (
                <ul className="list-disc space-y-1 pl-4 text-xs leading-snug text-ink-gray-6">
                  {help.details.map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
              )}
              {help.wiki && (
                <>
                  <div className="h-px w-full bg-outline-gray-1" />
                  <a
                    href={`${WIKI_BASE}/${help.wiki}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex w-fit items-center gap-1 self-center text-xs text-ink-gray-7 underline underline-offset-2 hover:text-ink-gray-9"
                  >
                    Learn more in the wiki <ArrowUpRight className="size-3" />
                  </a>
                </>
              )}
            </Popover.Popup>
          </Popover.Positioner>
        </Popover.Portal>
      </Popover.Root>
    </span>
  );
}
