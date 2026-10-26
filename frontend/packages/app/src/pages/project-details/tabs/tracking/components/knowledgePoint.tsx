/**
 * External dependencies.
 */
import { useRef } from "react";
import {
  InfoHoverCard,
  type FieldHelp,
} from "@next-pms/design-system/components";
import { Tooltip } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";

type KnowledgePointProps = {
  title: string;
  value: string;
  href?: string;
  help?: FieldHelp;
};

const CARD_CLASSNAME =
  "flex h-20 flex-1 min-w-0 flex-col justify-between rounded-xl border border-outline-gray-1 bg-surface-cards p-3";

const VALUE_CLASSNAME = "truncate text-xl font-medium text-ink-gray-8";

export function KnowledgePoint({
  title,
  value,
  href,
  help,
}: KnowledgePointProps) {
  const valueRef = useRef<HTMLSpanElement>(null);

  const titleRow = (
    <div className="flex min-w-0 items-center gap-1.5">
      <span className="truncate text-base font-normal text-ink-gray-5">
        {title}
      </span>
      {help && <InfoHoverCard help={help} className="relative z-10" />}
    </div>
  );

  if (href) {
    return (
      <div
        className={cn(
          CARD_CLASSNAME,
          "relative transition-colors hover:bg-surface-gray-1",
        )}
      >
        <Tooltip text={value} showWhen="truncated" truncationRef={valueRef}>
          <a
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={title}
            className="absolute inset-0 rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
          />
        </Tooltip>
        {titleRow}
        <span ref={valueRef} className={VALUE_CLASSNAME}>
          {value}
        </span>
      </div>
    );
  }

  return (
    <div className={CARD_CLASSNAME}>
      {titleRow}
      <Tooltip text={value} showWhen="truncated">
        <span className={VALUE_CLASSNAME}>{value}</span>
      </Tooltip>
    </div>
  );
}
