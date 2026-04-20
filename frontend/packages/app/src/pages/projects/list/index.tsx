/**
 * External dependencies.
 */
import { ListView } from "@rtcamp/frappe-ui-react";
import { useNavigate } from "react-router-dom";

/**
 * Internal dependencies.
 */
import { ROUTES } from "@/lib/constant";

import { ProjectListCell } from "./cell";
import { PROJECT_LIST_COLUMNS } from "./columns";
import { FAKE_PROJECTS } from "./fake-data";
import type { Project } from "./types";

function ProjectList() {
  const navigate = useNavigate();

  return (
    <ListView
      columns={PROJECT_LIST_COLUMNS}
      rows={FAKE_PROJECTS}
      rowKey="id"
      options={{
        options: {
          selectable: true,
          showTooltip: true,
          resizeColumn: true,
          onRowClick: (row: Project) =>
            navigate(`${ROUTES.project}/${row.id}`),
        },
        slots: {
          cell: ProjectListCell,
        },
      }}
    />
  );
}

export default ProjectList;
