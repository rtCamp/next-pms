/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { OverviewSection } from "../../components/overviewSection";
import { AddRepoDialog } from "./addRepoDialog";
import { RepoCell } from "./cells";
import { REPO_COLUMNS } from "./columns";
import { INITIAL_REPOS } from "./fake-data";
import type { RepoConnection } from "./types";

export function RepositoryConnections() {
  const [repos, setRepos] = useState<RepoConnection[]>(INITIAL_REPOS);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleAdd = useCallback((url: string) => {
    const trimmed = url.trim().replace(/\/$/, "");
    const segments = trimmed.split("/");
    const name = segments[segments.length - 1] || trimmed;
    const id = `${name}-${Date.now()}`;
    setRepos((prev) => [
      ...prev,
      {
        id,
        name,
        createdOn: new Date().toISOString().slice(0, 10),
        githubUrl: trimmed,
      },
    ]);
  }, []);

  const handleUnlink = useCallback((id: string) => {
    setRepos((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <OverviewSection
      title="Project repository connections"
      action={
        <Button
          variant="ghost"
          icon={AddSm}
          onClick={() => setDialogOpen(true)}
        />
      }
    >
      {repos.length === 0 ? (
        <div className="py-10 text-center text-sm text-ink-gray-4">
          No repositories connected
        </div>
      ) : (
        <table className="w-full text-sm whitespace-nowrap">
          <thead>
            <tr className="border-b border-outline-gray-1 text-ink-gray-5 text-left">
              {REPO_COLUMNS.map((column) => (
                <th
                  key={column.key}
                  className={`p-2 text-sm${column.width ? ` ${column.width}` : ""}`}
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {repos.map((repo) => (
              <tr
                key={repo.id}
                className="border-b border-outline-gray-1 last:border-b-0 hover:bg-surface-gray-1 transition-colors text-base text-ink-gray-6"
              >
                {REPO_COLUMNS.map((column) => (
                  <td key={column.key} className="p-2">
                    <RepoCell
                      repo={repo}
                      column={column}
                      onUnlink={handleUnlink}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <AddRepoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onAdd={handleAdd}
      />
    </OverviewSection>
  );
}
