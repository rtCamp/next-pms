/**
 * Internal dependencies.
 */
import { ActionsCell } from "../components/actionsCell";
import type { TableColumn } from "../columns";
import type { RepoConnection } from "../types";
import { DateCell } from "./dateCell";
import { RepoNameCell } from "./repoNameCell";

type RepoCellProps = {
  row: RepoConnection;
  column: TableColumn;
  onUnlink: (id: string) => void;
};

export function RepoCell({ row, column, onUnlink }: RepoCellProps) {
  switch (column.key) {
    case "repoName":
      return <RepoNameCell repo={row} />;
    case "createdOn":
      return <DateCell date={row.createdOn} />;
    case "actions":
      return <ActionsCell repo={row} onUnlink={onUnlink} />;
    default:
      return null;
  }
}
