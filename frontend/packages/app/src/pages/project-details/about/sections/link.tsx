/**
 * External dependencies.
 */
import { useMemo } from "react";
import { Github } from "@next-pms/design-system/components";
import {
  Hashtag,
  SolidExternalLink,
  SolidSharedFolder,
} from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { safeExternalUrl } from "@/lib/utils";
import { Section } from "../section";
import { useSidebar } from "../sidebarContext";

const LINK_CLASS =
  "flex h-7 w-7 items-center justify-center rounded text-ink-gray-7 bg-surface-gray-2 hover:bg-surface-gray-4";

export function LinkSection() {
  const links = useSidebar((state) => state.sidebar.links);

  // Link values come from unvalidated `Data` fields, so an unusable one drops
  // its icon rather than rendering an anchor that goes nowhere safe.
  const href = useMemo(
    () => ({
      website: safeExternalUrl(links.website),
      googleDrive: safeExternalUrl(links.google_drive),
      slack: safeExternalUrl(links.slack),
      github: safeExternalUrl(links.github),
    }),
    [links.website, links.google_drive, links.slack, links.github],
  );

  return (
    <Section
      value="links"
      title="Links"
      empty={!href.website && !href.googleDrive && !href.slack && !href.github}
    >
      <div className="flex items-center gap-2">
        {href.website && (
          <a
            href={href.website}
            target="_blank"
            rel="noreferrer"
            aria-label="Project website"
            className={LINK_CLASS}
          >
            <SolidExternalLink className="h-4 w-4" />
          </a>
        )}
        {href.googleDrive && (
          <a
            href={href.googleDrive}
            target="_blank"
            rel="noreferrer"
            aria-label="Drive folder"
            className={LINK_CLASS}
          >
            <SolidSharedFolder className="h-4 w-4" />
          </a>
        )}
        {href.slack && (
          <a
            href={href.slack}
            target="_blank"
            rel="noreferrer"
            aria-label="Slack channel"
            className={LINK_CLASS}
          >
            <Hashtag className="h-4 w-4" />
          </a>
        )}
        {href.github && (
          <a
            href={href.github}
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
