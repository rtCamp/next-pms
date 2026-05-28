/**
 * External dependencies.
 */
import { SolidBranch } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
export function RepoNameCell({ repoName }: { repoName: string }) {
  return (
    <div className="flex items-center gap-2 min-w-0">
      <SolidBranch className="size-4 shrink-0 text-ink-gray-6" />
      <a
        href={`https://github.com/${repoName}`}
        target="_blank"
        rel="noopener noreferrer"
        className="text-base font-medium text-ink-gray-7 truncate"
      >
        {repoName}
      </a>
    </div>
  );
}
