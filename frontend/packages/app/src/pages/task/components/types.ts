/**
 * External dependencies.
 */
import type { KeyedMutator } from "swr";
/**
 * Internal dependencies.
 */
import type { ViewData } from "@/store/view";
import type { DocMetaProps } from "@/types";
import type { Action, TaskState } from "../types";

export type AddTaskPropType = {
  task: TaskState;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mutate: KeyedMutator<any>;
  dispatch: React.Dispatch<Action>;
};

export type columnWidthType = {
  subject: string;
  due_date: string;
  project_name: string;
  status: string;
  priority: string;
  expected_time: string;
  actual_time: string;
};
export type openTaskLogType = (taskName: string) => void;
export type handleAddTimeType = (taskName: string) => void;
export type handleLikeType = (e: React.MouseEvent<SVGSVGElement>) => void;

export type FieldMeta = Omit<
  DocMetaProps,
  "title_field" | "doctype" | "default_fields"
>;

export interface HeaderProps {
  meta: DocMetaProps;
  columnOrder: Array<string>;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  onColumnHide: (column: string) => void;
  view: ViewData;
  stateUpdated: boolean;
  setStateUpdated: (value: boolean) => void;
  taskState: TaskState;
  taskDispatch: React.Dispatch<Action>;
}

export type Employee = {
  employee: string;
  employee_name: string;
  image: string;
  total_hour: number;
};
export type LogData = {
  employee: string;
  hours: number;
  description: string[];
};
export type TaskLogProps = {
  task: string;
  isOpen: boolean;
  onOpenChange: React.Dispatch<React.SetStateAction<boolean>>;
};

export interface TaskTableProps {
  viewData: ViewData;
  meta: DocMetaProps;
}
