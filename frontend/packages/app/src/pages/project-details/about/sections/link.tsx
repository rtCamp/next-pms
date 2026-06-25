/**
 * External dependencies.
 */
import { Github } from "@next-pms/design-system/components";
import {
  Hashtag,
  SolidExternalLink,
  SolidSharedFolder,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { Section } from "../section";
import { useSidebar } from "../sidebarContext";

const LINK_CLASS =
  "flex h-7 w-7 items-center justify-center rounded text-ink-gray-7 bg-surface-gray-2 hover:bg-surface-gray-4";

export function LinkSection() {
  const links = useSidebar((state) => state.sidebar.links);

  return (
    <Section
      value="links"
      title="Links"
      empty={
        !links.website && !links.google_drive && !links.slack && !links.github
      }
    >
      <div className="flex items-center gap-2">
        {links.website && (
          <a
            href={links.website}
            target="_blank"
            rel="noreferrer"
            aria-label="Project website"
            className={LINK_CLASS}
          >
            <SolidExternalLink className="h-4 w-4" />
          </a>
        )}
        {links.google_drive && (
          <a
            href={links.google_drive}
            target="_blank"
            rel="noreferrer"
            aria-label="Drive folder"
            className={LINK_CLASS}
          >
            <SolidSharedFolder className="h-4 w-4" />
          </a>
        )}
        {links.slack && (
          <a
            href={links.slack}
            target="_blank"
            rel="noreferrer"
            aria-label="Slack channel"
            className={LINK_CLASS}
          >
            <Hashtag className="h-4 w-4" />
          </a>
        )}
        {links.github && (
          <a
            href={links.github}
            target="_blank"
            rel="noreferrer"
            aria-label="GitHub repository"
            className={LINK_CLASS}
          >
            <Github className="h-4 w-4" />
          </a>
        )}
      </div>
    </Section>
  );
}
