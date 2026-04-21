/**
 * External dependencies.
 */
import { ListView } from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { ProjectListCell } from "./cells";
import { PROJECT_LIST_COLUMNS } from "./columns";
import { FAKE_PROJECTS } from "./fake-data";

function ProjectList() {
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
        },
        slots: {
          cell: ProjectListCell,
        },
      }}
    />
  );
}

export default ProjectList;
