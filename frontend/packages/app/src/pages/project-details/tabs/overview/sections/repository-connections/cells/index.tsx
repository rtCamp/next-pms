/**
 * Internal dependencies.
 */
import type { TableColumn } from "../columns";
import type { RepoConnection } from "../types";
import { DateCell } from "./dateCell";
import { RepoNameCell } from "./repoNameCell";
import { ActionsCell } from "../components/actionsCell";

type RepoCellProps = {
  row: RepoConnection;
  column: TableColumn;
};

export function RepoCell({ row, column }: RepoCellProps) {
  switch (column.key) {
    case "repoName":
      return <RepoNameCell repo={row} />;
    case "createdOn":
      return <DateCell date={row.createdOn} />;
    case "actions":
      return <ActionsCell repo={row} />;
    default:
      return null;
  }
}
