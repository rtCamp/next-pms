/**
 * External dependencies.
 */
import { useState } from "react";
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRowItem,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";

/**
 * Internal dependencies.
 */
import { ProjectListCell } from "./cells";
import { PROJECT_LIST_COLUMNS } from "./columns";
import { FAKE_PROJECTS } from "./fake-data";

function ProjectList() {
  const [columns, setColumns] = useState(PROJECT_LIST_COLUMNS);
  return (
    <ListView
      className="px-5 py-0 scrollbar-thin"
      columns={columns}
      rows={FAKE_PROJECTS}
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
        {columns.map((column, index) => (
          <ListHeaderItem
            key={column.key}
            item={column}
            onColumnWidthUpdated={(width) => {
              setColumns((prevColumns) => {
                const newColumns = [...prevColumns];
                newColumns[index] = {
                  ...newColumns[index],
                  width: `${width}px`,
                };
                return newColumns;
              });
            }}
          >
            <div className="flex h-7 items-center py-1.5">
              <span className="truncate">{column.label}</span>
            </div>
          </ListHeaderItem>
        ))}
      </ListHeader>
      <ListRows>
        {FAKE_PROJECTS.map((row) => (
          <ListRow key={row.id} row={row}>
            {columns.map((column) => {
              //@ts-expect-error item type
              const item = row[column.key];
              return <ProjectListCell row={row} column={column} item={item} />;
            })}
          </ListRow>
        ))}
      </ListRows>
    </ListView>
  );
}

export default ProjectList;
