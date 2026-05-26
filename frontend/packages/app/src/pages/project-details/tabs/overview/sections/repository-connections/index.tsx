/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
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
import { RepoCell } from "./cells";
import { REPO_COLUMNS } from "./columns";
import { AddRepoDialog } from "./components/addRepoDialog";
import type { RepoConnection } from "./types";
import { useProjectDetail } from "../../../../context";
import { OverviewSection } from "../../components/overviewSection";

export function RepositoryConnections() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const connections = useProjectDetail(
    (s) => s.project?.custom_project_repository_connections,
  );

  const repos = useMemo<RepoConnection[]>(
    () =>
      (connections ?? [])
        .filter((c) => c.github_repository)
        .map((c) => ({
          id: c.name,
          name: c.github_repository as string,
          createdOn: format(new Date(c.creation), "yyyy-MM-dd"),
          githubUrl: `https://github.com/${c.github_repository}`,
        })),
    [connections],
  );

  const connectedIds = useMemo(
    () =>
      new Set(
        (connections ?? [])
          .map((c) => c.github_repository)
          .filter((id): id is string => Boolean(id)),
      ),
    [connections],
  );

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
                  <RepoCell key={column.key} row={repo} column={column} />
                ))}
              </ListRow>
            ))
          )}
        </ListRows>
      </ListView>
      <AddRepoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        connectedIds={connectedIds}
      />
    </OverviewSection>
  );
}
