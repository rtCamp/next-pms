/**
 * External dependencies.
 */
import { ArrowUpRight } from "@rtcamp/frappe-ui-react/icons";

interface GanttOpenLinkProps {
  href: string;
  label: string;
}

export function GanttOpenLink({ href, label }: GanttOpenLinkProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="shrink-0 rounded-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-outline-gray-3"
      onClick={(event) => event.stopPropagation()}
    >
      <ArrowUpRight className="size-4 text-ink-gray-8 shrink-0" />
    </a>
  );
}
