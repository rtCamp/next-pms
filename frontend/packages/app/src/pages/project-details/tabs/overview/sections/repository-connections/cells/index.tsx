/**
 * External dependencies.
 */
import { format } from "date-fns";

/**
 * Internal dependencies.
 */
import { ProjectRepositoryConnection } from "@/pages/project-details/types";
import { TextCell } from "@/pages/projects/list/cells/textCell";
import type { TableColumn } from "../columns";
import { DateCell } from "./dateCell";
import { RepoNameCell } from "./repoNameCell";
import { ActionsCell } from "../components/actionsCell";

type RepoCellProps = {
  row: ProjectRepositoryConnection;
  column: TableColumn;
};

export function RepoCell({ row, column }: RepoCellProps) {
  switch (column.key) {
    case "repoName":
      if (!row.github_repository) {
        return <TextCell text="N/A" />;
      }
      return <RepoNameCell repoName={row.github_repository} />;
    case "createdOn":
      return <DateCell date={format(new Date(row.creation), "yyyy-MM-dd")} />;
    case "actions":
      return <ActionsCell repoId={row.name} />;
    default:
      return null;
  }
}
