/**
 * Internal dependencies.
 */
import { Section } from "./section";
import type { ProjectLink } from "./types";

export function LinksSection({ links }: { links: ProjectLink[] }) {
  return (
    <Section value="links" title="Links">
      <div className="flex items-center gap-2 px-5 pb-3">
        {links.map(({ key, label, href, icon: Icon }) => (
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            aria-label={label}
            title={label}
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-gray-2 text-ink-gray-7 transition-colors hover:bg-surface-gray-3"
          >
            <Icon aria-hidden className="size-[18px]" />
          </a>
        ))}
      </div>
    </Section>
  );
}
