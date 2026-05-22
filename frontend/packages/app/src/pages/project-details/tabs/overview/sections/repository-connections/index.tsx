/**
 * External dependencies.
 */
import { useCallback, useMemo, useState } from "react";
import {
  Button,
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import { OverviewSection } from "../../components/overviewSection";
import { RepoCell } from "./cells";
import { REPO_COLUMNS } from "./columns";
import { AddRepoDialog } from "./components/addRepoDialog";
import { INITIAL_REPOS } from "./fake-data";
import type { AvailableRepo, RepoConnection } from "./types";

export function RepositoryConnections() {
  const [repos, setRepos] = useState<RepoConnection[]>(INITIAL_REPOS);
  const [dialogOpen, setDialogOpen] = useState(false);

  const connectedIds = useMemo(
    () => new Set(repos.map((r) => r.id)),
    [repos],
  );

  const handleConnect = useCallback((repo: AvailableRepo) => {
    setRepos((prev) => [
      ...prev,
      {
        id: repo.id,
        name: repo.name,
        createdOn: format(new Date(), "yyyy-MM-dd"),
        githubUrl: repo.githubUrl,
      },
    ]);
  }, []);

  const handleUnlink = useCallback((id: string) => {
    setRepos((prev) => prev.filter((r) => r.id !== id));
  }, []);

  return (
    <OverviewSection
      title="Project repository connections"
      actions={
        <Button
          variant="ghost"
          icon={AddSm}
          aria-label="Connect repository"
          onClick={() => setDialogOpen(true)}
        />
      }
    >
      <ListView
        columns={REPO_COLUMNS}
        rows={repos}
        rowKey="id"
        options={{
          options: {
            selectable: false,
            showTooltip: false,
            resizeColumn: false,
          },
        }}
      >
        <ListHeader className="mb-0 rounded-none bg-transparent border-b border-outline-gray-1 p-2 gap-2">
          {REPO_COLUMNS.map((column) => (
            <ListHeaderItem key={column.key} item={column}>
              <div className="flex h-7 items-center py-1.5">
                {column.srOnly ? (
                  <span className="sr-only">{column.label}</span>
                ) : (
                  <span className="truncate">{column.label}</span>
                )}
              </div>
            </ListHeaderItem>
          ))}
        </ListHeader>
        <ListRows>
          {repos.length === 0 ? (
            <div className="py-10 text-center text-sm text-ink-gray-4">
              No repositories connected
            </div>
          ) : (
            repos.map((repo) => (
              <ListRow key={repo.id} row={repo}>
                {REPO_COLUMNS.map((column) => (
                  <RepoCell
                    key={column.key}
                    row={repo}
                    column={column}
                    onUnlink={handleUnlink}
                  />
                ))}
              </ListRow>
            ))
          )}
        </ListRows>
      </ListView>
      <AddRepoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConnect={handleConnect}
        connectedIds={connectedIds}
      />
    </OverviewSection>
  );
}
