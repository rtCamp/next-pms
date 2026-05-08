/**
 * External dependencies.
 */
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { useFrappeGetDocList } from "frappe-react-sdk";
import { ProjectListCell } from "./cells";
import { PROJECT_LIST_COLUMNS } from "./columns";
import { ResponseProject } from "./types";

function ProjectList() {
  const { data, error, isLoading } = useFrappeGetDocList<ResponseProject>(
    "Project",
    { fields: ["*"] },
  );

  if (isLoading) {
    return;
  }

  if (!data) {
    return;
  }

  if (error) {
    return;
  }

  return (
    <ListView
      className="px-5 py-0 scrollbar-thin"
      columns={PROJECT_LIST_COLUMNS}
      rows={data}
      rowKey="id"
      options={{
        options: {
          selectable: true,
          showTooltip: true,
          resizeColumn: false,
        },
        slots: {
          cell: ProjectListCell,
        },
      }}
    >
      <ListHeader className="mb-0 rounded-none bg-transparent border-b border-outline-gray-1 p-2 gap-2">
        {PROJECT_LIST_COLUMNS.map((column) => (
          <ListHeaderItem key={column.key} item={column}>
            <div className="flex h-7 items-center py-1.5">
              <span className="truncate">{column.label}</span>
            </div>
          </ListHeaderItem>
        ))}
      </ListHeader>
      <ListRows>
        {data.map((row) => (
          <ListRow key={row.name} row={row}>
            {PROJECT_LIST_COLUMNS.map((column) => {
              return <ProjectListCell row={row} column={column} />;
            })}
          </ListRow>
        ))}
      </ListRows>
    </ListView>
  );
}

export default ProjectList;
