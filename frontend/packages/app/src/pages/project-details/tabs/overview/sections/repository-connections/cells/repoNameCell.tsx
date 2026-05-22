/**
 * External dependencies.
 */
import { SolidBranch } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import type { RepoConnection } from "../types";

export function RepoNameCell({ repo }: { repo: RepoConnection }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <SolidBranch className="size-4 shrink-0 text-ink-gray-6" />
      <a
        href={repo.githubUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-base font-medium text-ink-gray-7 truncate"
      >
        {repo.name}
      </a>
    </div>
  );
}
