/**
 * External dependencies.
 */
import { Fragment } from "react";
import { Popover } from "@base-ui/react/popover";
import { Tooltip } from "@rtcamp/frappe-ui-react";
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";
import { Info } from "lucide-react";

/**
 * Internal dependencies.
 */
import { WIKI_BASE } from "./constants";
import type { InfoHoverCardProps, LegendItem } from "./types";
import { mergeClassNames as cn } from "../../utils";

function LegendSample({ item }: { item: LegendItem }) {
  const { className, sample, icon: Icon, marker, children } = item;
  if (children) return children;
  if (Icon) return <Icon className={cn("size-3.5", className)} />;
  return (
    <span className={cn("relative tabular-nums", className)}>
      {sample}
      {marker && (
        <span
          className={cn(
            "absolute -bottom-0.5 left-1/2 size-1 -translate-x-1/2 rounded-full",
            marker,
          )}
        />
      )}
    </span>
  );
}

/** A popover rather than a tooltip, so the wiki link inside stays clickable. */
export default function InfoHoverCard({
  help,
  tooltip,
  className,
}: InfoHoverCardProps) {
  const triggerClassName = cn(
    "inline-flex size-3 shrink-0 items-center justify-center rounded text-ink-gray-4 transition-colors hover:text-ink-gray-7 focus-visible:outline-2 focus-visible:outline-outline-gray-3 data-popup-open:text-ink-gray-7",
    className,
  );

  if (!help) {
    return (
      <span className="inline-flex shrink-0">
        <Tooltip
          body={
            <div className="max-w-60 rounded bg-surface-gray-7 px-2 py-1 text-xs text-pretty text-ink-white shadow-xl">
              {tooltip}
            </div>
          }
        >
          <button
            type="button"
            aria-label={tooltip}
            className={triggerClassName}
          >
            <Info size={10} />
          </button>
        </Tooltip>
      </span>
    );
  }

  return (
    <span className="inline-flex shrink-0">
      <Popover.Root>
        <Popover.Trigger
          openOnHover
          delay={300}
          closeDelay={150}
          aria-label={`About ${help.title}`}
          className={triggerClassName}
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
              {help.legend && (
                <dl className="grid grid-cols-[auto_1fr] items-baseline gap-2 text-xs leading-snug text-ink-gray-6">
                  {help.legend.map((item) => (
                    <Fragment key={item.label}>
                      <dt
                        className={cn(
                          "flex",
                          (item.icon || item.children) && "self-center",
                        )}
                      >
                        <LegendSample item={item} />
                      </dt>
                      <dd
                        className={cn(
                          "text-pretty",
                          (item.icon || item.children) && "self-center",
                        )}
                      >
                        {item.label}
                      </dd>
                    </Fragment>
                  ))}
                </dl>
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
