/**
 * Internal dependencies.
 */
import { AboutSection } from "./aboutSection";
import { LinkButton } from "./linkButton";
import type { ProjectLink } from "./types";

export function LinksSection({ links }: { links: ProjectLink[] }) {
  return (
    <AboutSection value="links" title="Links">
      <div className="flex items-center gap-2 px-5 pb-3">
        {links.map((link) => (
          <LinkButton
            key={link.key}
            label={link.label}
            href={link.href}
            icon={link.icon}
          />
        ))}
      </div>
    </AboutSection>
  );
}
