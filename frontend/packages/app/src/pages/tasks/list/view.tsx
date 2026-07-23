/**
 * External dependencies.
 */
import { useCallback, useState } from "react";
import { getTodayDate, mergeClassNames as cn } from "@next-pms/design-system";
import { DeleteActionDialog } from "@next-pms/design-system/components";
import {
  ListHeader,
  ListHeaderItem,
  ListRow,
  ListRows,
  ListView,
} from "@rtcamp/frappe-ui-react";
import { ArrowDown, ArrowUp } from "@rtcamp/frappe-ui-react/icons";

/**
 * Internal dependencies.
 */
import { InfiniteScroll } from "@/components/infiniteScroll";
import PersonalTaskLog from "@/components/task-log/personalTaskLog";
import TeamTaskLog from "@/components/task-log/teamTaskLog";
import AddTime from "@/pages/timesheet/components/add-time";
import type { OpenAddTimeDialogOptions } from "@/pages/timesheet/outletContext";
import { useUser } from "@/providers/user";
import { TaskListCell } from "./cells";
import { TASK_LIST_COLUMNS } from "./columns";
import { useTaskList } from "./context";
import { TASK_LIST_PAGE_SIZE, TASK_SORTABLE_FIELDS } from "../constants";
import { useTaskFilters } from "../useTaskFilters";

const SORT_FIELD_BY_COLUMN = new Map(
  TASK_SORTABLE_FIELDS.map((f) => [f.column as string, f.field as string]),
);

function TaskList() {
  const data = useTaskList((c) => c.state.data);
  const isLoading = useTaskList((c) => c.state.isLoading);
  const hasMore = useTaskList((c) => c.state.hasMore);
  const loadMore = useTaskList((c) => c.actions.loadMore);
  const deleteTask = useTaskList((c) => c.actions.deleteTask);
  const { sort, setSort } = useTaskFilters();
  const roles = useUser(({ state }) => state.roles);
  const showTeamTaskLog =
    roles.includes("Projects Manager") || roles.includes("Timesheet Manager");
  const [openTask, setOpenTask] = useState<string | null>(null);
  const [addTimePrefill, setAddTimePrefill] =
    useState<OpenAddTimeDialogOptions>({ date: getTodayDate() });
  const [isAddTimeOpen, setIsAddTimeOpen] = useState(false);
  const [deleteTaskName, setDeleteTaskName] = useState<string | null>(null);

  const handleAddTime = useCallback((prefill: OpenAddTimeDialogOptions) => {
    setAddTimePrefill({ date: getTodayDate(), ...prefill });
    setIsAddTimeOpen(true);
  }, []);

  const handleHeaderClick = (sortField: string) => {
    if (sort.field === sortField) {
      setSort({
        field: sortField,
        order: sort.order === "asc" ? "desc" : "asc",
      });
    } else {
      setSort({ field: sortField, order: "desc" });
    }
  };

  return (
    <>
      <ListView
        className="px-5 py-0 scrollbar-thin"
        columns={TASK_LIST_COLUMNS}
        rows={data}
        rowKey="name"
        options={{
          options: {
            selectable: false,
            showTooltip: true,
            resizeColumn: false,
          },
          slots: {
            cell: TaskListCell,
          },
        }}
      >
        <ListHeader className="mb-0 rounded-none bg-transparent border-b border-outline-gray-1 p-2 gap-2">
          {TASK_LIST_COLUMNS.map((column) => {
            const sortField = SORT_FIELD_BY_COLUMN.get(column.key);
            return (
              <ListHeaderItem key={column.key} item={column}>
                <div
                  className={cn(
                    "flex h-7 items-center gap-1 py-1.5",
                    sortField && "cursor-pointer select-none",
                  )}
                  onClick={
                    sortField ? () => handleHeaderClick(sortField) : undefined
                  }
                >
                  <span className="truncate">{column.label}</span>
                  {sortField &&
                    sort.field === sortField &&
                    (sort.order === "asc" ? (
                      <ArrowUp className="size-3.5 shrink-0 text-ink-gray-7" />
                    ) : (
                      <ArrowDown className="size-3.5 shrink-0 text-ink-gray-7" />
                    ))}
                </div>
              </ListHeaderItem>
            );
          })}
        </ListHeader>
        <ListRows>
          {data.length === 0 ? (
            <p className="py-6 text-center text-base text-ink-gray-5">
              No tasks found.
            </p>
          ) : (
            <InfiniteScroll
              isLoading={isLoading}
              hasMore={hasMore}
              verticalLodMore={loadMore}
              count={TASK_LIST_PAGE_SIZE}
            >
              {data.map((row) => (
                <ListRow key={row.name} row={row}>
                  {TASK_LIST_COLUMNS.map((column) => (
                    <TaskListCell
                      key={column.key}
                      row={row}
                      column={column}
                      onOpenTask={setOpenTask}
                      onAddTime={handleAddTime}
                      onDeleteTask={setDeleteTaskName}
                    />
                  ))}
                </ListRow>
              ))}
            </InfiniteScroll>
          )}
        </ListRows>
      </ListView>
      {openTask &&
        (showTeamTaskLog ? (
          <TeamTaskLog
            task={openTask}
            open={Boolean(openTask)}
            onOpenChange={(open) => !open && setOpenTask(null)}
          />
        ) : (
          <PersonalTaskLog
            task={openTask}
            open={Boolean(openTask)}
            onOpenChange={(open) => !open && setOpenTask(null)}
          />
        ))}
      <AddTime
        initialDate={addTimePrefill.date || getTodayDate()}
        open={isAddTimeOpen}
        onOpenChange={setIsAddTimeOpen}
        project={addTimePrefill.project}
        projectLabel={addTimePrefill.projectLabel}
        task={addTimePrefill.task}
        taskLabel={addTimePrefill.taskLabel}
      />
      {deleteTaskName && (
        <DeleteActionDialog
          title="Delete task"
          description="Are you sure you want to delete this task? This action cannot be undone."
          onClose={() => setDeleteTaskName(null)}
          onConfirm={() => deleteTask(deleteTaskName)}
        />
      )}
    </>
  );
}

export default TaskList;
