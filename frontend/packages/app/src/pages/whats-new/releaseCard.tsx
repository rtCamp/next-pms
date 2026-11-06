/**
 * External dependencies.
 */
import { useId, useState } from "react";
import { Badge } from "@rtcamp/frappe-ui-react";
import { format, parseISO } from "date-fns";
import { ChevronDown } from "lucide-react";
/**
 * Internal dependencies.
 */
import { mergeClassNames as cn } from "@/lib/utils";
import type { Release } from "./types";

type ReleaseCardProps = {
  release: Release;
  isLatest: boolean;
};

export function ReleaseCard({ release, isLatest }: ReleaseCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const versionId = useId();
  const contentId = useId();
  const isExpanded = isLatest || isOpen;

  const headerContent = (
    <>
      <span
        id={versionId}
        className="text-xl font-semibold tracking-[-0.005em] text-ink-gray-8 whitespace-nowrap"
      >
        v{release.version}
      </span>
      {isLatest && (
        <Badge theme="blue" variant="subtle" size="sm" label="Latest" />
      )}
      <span className="ml-auto text-sm text-ink-gray-5 tabular-nums max-md:order-last max-md:ml-0 max-md:basis-full">
        {format(parseISO(release.date), "d MMM yyyy")}
      </span>
      {!isLatest && (
        <ChevronDown
          aria-hidden="true"
          size={16}
          className={cn(
            "shrink-0 text-ink-gray-5 transition-transform duration-150 ease-in-out motion-reduce:transition-none max-md:ml-auto",
            isOpen && "rotate-180",
          )}
        />
      )}
    </>
  );
  const headerClassName =
    "flex w-full flex-wrap items-center gap-2.5 px-5 py-4 text-left";

  return (
    <section
      aria-labelledby={versionId}
      className="overflow-hidden rounded-lg border border-outline-gray-1 bg-surface-white"
    >
      <h2>
        {isLatest ? (
          <span className={headerClassName}>{headerContent}</span>
        ) : (
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={contentId}
            onClick={() => setIsOpen((open) => !open)}
            className={cn(
              headerClassName,
              "transition-colors duration-100 ease-out hover:bg-surface-gray-2",
            )}
          >
            {headerContent}
          </button>
        )}
      </h2>
      {isExpanded && (
        <div
          id={contentId}
          className="release-notes border-t border-outline-gray-1 px-5 py-4"
          dangerouslySetInnerHTML={{ __html: release.html }}
        />
      )}
    </section>
  );
}
