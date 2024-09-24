import { ColumnDef, Table as TanStackTable } from "@tanstack/react-table";
import { TaskData, ProjectNestedTaskData } from "@/types";

export type setLocalStorageTaskStateType = React.Dispatch<
  React.SetStateAction<localStorageTaskType>
>;
export type setNestedProjectMutateCallType = React.Dispatch<
  React.SetStateAction<() => void>
>;
export type setFlatTaskMutateCallType = React.Dispatch<
  React.SetStateAction<() => void>
>;
export type setProjectSearchType = React.Dispatch<React.SetStateAction<string>>;

export type FlatTableType = TanStackTable<TaskData>;
export type NestedRowTableType = TanStackTable<ProjectNestedTaskData>;
export type ColumnsType = ColumnDef<TaskData>[];
export type ProjectNestedColumnsType = ColumnDef<ProjectNestedTaskData>[];
export type subjectSearchType = string;
export type GroupByParamType = string[];
export type columnsToExcludeActionsInTablesType = string[];
export type localStorageTaskType = {
  /* eslint-disable-next-line */
  hideColumn: any[];
  /* eslint-disable-next-line */
  groupBy: any[];
  /* eslint-disable-next-line */
  projects: any[];
  /* eslint-disable-next-line */
  columnWidth: {
    subject: string;
    due_date: string;
    project_name: string;
    status: string;
    priority: string;
    expected_time: string;
    actual_time: string;
  };
  /* eslint-disable-next-line */
  columnSort: any[];
};
export type MoreTableOptionsDropDownType = "normal" | "nestedSubMenu";
