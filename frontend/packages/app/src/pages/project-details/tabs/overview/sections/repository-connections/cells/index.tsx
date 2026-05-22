/**
 * Internal dependencies.
 */
import type { TableColumn } from "../columns";
import type { RepoConnection } from "../types";
import { ActionsCell } from "./actionsCell";
import { DateCell } from "./dateCell";
import { RepoNameCell } from "./repoNameCell";

type RepoCellProps = {
  repo: RepoConnection;
  column: TableColumn;
  onUnlink: (id: string) => void;
};

export function RepoCell({ repo, column, onUnlink }: RepoCellProps) {
  switch (column.key) {
    case "repoName":
      return <RepoNameCell repo={repo} />;
    case "createdOn":
      return <DateCell date={repo.createdOn} />;
    case "actions":
      return <ActionsCell repo={repo} onUnlink={onUnlink} />;
    default:
      return null;
  }
}
