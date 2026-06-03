/**
 * External dependencies.
 */
import { useMemo, useState } from "react";
import { Button } from "@rtcamp/frappe-ui-react";
import { AddSm } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { RepoCell } from "./cells";
import { REPO_COLUMNS } from "./columns";
import { AddRepoDialog } from "./components/addRepoDialog";
import { useProjectDetail } from "../../../../context";
import { OverviewSection } from "../../components/overviewSection";

const gridTemplateColumns = REPO_COLUMNS.map((c) =>
  typeof c.width === "number" ? `${c.width}fr` : c.width,
).join(" ");

export function RepositoryConnections() {
  const [dialogOpen, setDialogOpen] = useState(false);

  const connections = useProjectDetail(
    (s) => s.project?.custom_project_repository_connections || [],
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
      <div className="rounded-md">
        <div
          className="grid items-center gap-2 border-b border-outline-gray-1 px-2 py-1.5 text-sm text-ink-gray-5"
          style={{ gridTemplateColumns }}
        >
          {REPO_COLUMNS.map((column) => (
            <div key={column.key} className="flex h-7 items-center">
              {column.srOnly ? (
                <span className="sr-only">{column.label}</span>
              ) : (
                <span className="truncate">{column.label}</span>
              )}
            </div>
          ))}
        </div>
        {connections.length === 0 ? (
          <div className="py-10 text-center text-sm text-ink-gray-4">
            No repositories connected
          </div>
        ) : (
          connections.map((connection) => (
            <div
              key={connection.name}
              className="grid items-center gap-2 px-2 py-2 text-ink-gray-7 border-b border-outline-gray-1 last:border-b-0"
              style={{ gridTemplateColumns }}
            >
              {REPO_COLUMNS.map((column) => (
                <RepoCell key={column.key} row={connection} column={column} />
              ))}
            </div>
          ))
        )}
      </div>
      <AddRepoDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        connectedIds={connectedIds}
      />
    </OverviewSection>
  );
}
