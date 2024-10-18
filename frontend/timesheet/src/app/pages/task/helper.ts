import { LOCAL_STORAGE_TASK } from "@/lib/constant";
import { tableAttributePropsType } from "@/types/task";

export const columnMap = {
  project_name: "Project Name",
  subject: "Subject",
  status: "Status",
  priority: "Priority",
  due_date: "Due Date",
  expected_time: "Expected Hours",
  actual_time: "Hour Spent",
  timesheetAction:"Time",
  liked:"Liked",
};

export const colOrder: string[] = [
  "project_name",
  "subject",
  "status",
  "priority",
  "due_date",
  "expected_time",
  "actual_time",
  "timesheetAction",
  "liked",
];
// LocalStorage State Map
export const localStorageTaskDataMap:tableAttributePropsType = {
  hideColumn: [],
  groupBy: [],
  projects: [],
  columnWidth: {
    subject: "150",
    due_date: "150",
    project_name: "150",
    status: "150",
    priority: "150",
    expected_time: "150",
    actual_time: "150",
  },
  columnOrder: colOrder,
  columnSort: [],
  order: "desc",
  orderColumn: "modified",
};

export const getTableProps = ():tableAttributePropsType => {
  try {
    const data = JSON.parse(String(localStorage.getItem(LOCAL_STORAGE_TASK)));
    if (!data) {
      return localStorageTaskDataMap;
    } else {
      return data;
    }
  } catch (error) {
    return localStorageTaskDataMap;
  }
};
