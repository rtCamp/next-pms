/**
 * External dependencies
 */
import { useCallback, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Plus } from "lucide-react";
/**
 * Internal dependencies
 */
import { Header as ListViewHeader } from "@/app/components/listview/header";
import { RootState } from "@/store";
import { setAddTaskDialog, setSearch, setSelectedProject, setSelectedStatus, TaskStatusType } from "@/store/task";
import { ViewData } from "@/store/view";
import { DocMetaProps } from "@/types";
import { createFilter } from "./utils";

interface HeaderProps {
  meta: DocMetaProps;
  columnOrder: Array<string>;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  onColumnHide: (column: string) => void;
  view: ViewData;
}
export const Header = ({ meta, columnOrder, setColumnOrder, onColumnHide, view }: HeaderProps) => {
  const taskState = useSelector((state: RootState) => state.task);
  const [projectSearch, setProjectSeach] = useState<string>("");
  const dispatch = useDispatch();

  const handleSearch = (text: string) => {
    dispatch(setSearch(text));
  };
  const handleProjectChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedProject(normalizedFilters));
    },
    [dispatch]
  );
  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedStatus(normalizedFilters as TaskStatusType[]));
    },
    [dispatch]
  );
  const filters = [
    {
      type: "search",
      queryParameterName: "search",
      label: "Subject",
      value: taskState.search,
      queryParameterDefault: taskState.search,
      handleChange: handleSearch,
      handleDelete: handleSearch,
    },
    {
      type: "select-search",
      queryParameterName: "project",
      label: "Project",
      value: taskState.selectedProject,
      apiCall: {
        url: "frappe.client.get_list",
        filters: {
          doctype: "Project",
          fields: ["name", "project_name as label"],
          or_filters: [
            ["name", "like", `%${projectSearch}%`],
            ["project_name", "like", `%${projectSearch}%`],
          ],
        },
        options: {
          revalidateOnFocus: false,
          revalidateIfStale: false,
        },
      },
      queryParameterDefault: taskState.selectedProject,
      handleChange: handleProjectChange,
      shouldFilterComboBox: false,
      isMultiComboBox: true,
      handleDelete: handleProjectChange,
      onComboSearch: (searchTerm: string) => {
        setProjectSeach(searchTerm);
      },
    },
    {
      type: "select-list",
      queryParameterName: "status",
      label: "Status",
      value: taskState.selectedStatus,
      queryParameterDefault: taskState.selectedStatus,
      shouldFilterComboBox: true,
      isMultiComboBox: true,
      data: [
        { value: "Open", label: "Open" },
        { value: "Working", label: "Working" },
        { value: "Pending Review", label: "Pending Review" },
        { value: "Overdue", label: "Overdue" },
        { value: "Template", label: "Template" },
        { value: "Completed", label: "Completed" },
        { value: "Cancelled", label: "Cancelled" },
      ],
      handleChange: handleStatusChange,
      handleDelete: handleStatusChange,
    },
  ];
  const columnSelector = {
    fieldMeta: meta.fields,
    columnOrder,
    setColumnOrder,
    onColumnHide: onColumnHide,
  };
  const actions = {
    docType: meta.doctype,
    exportProps: {
      pageLength: taskState.task.length,
      totalCount: taskState.total_count,
      orderBy: `${taskState.orderColumn}  ${taskState.order}`,
      fields: columnOrder.reduce((acc: { [key: string]: string }, value) => {
        const m = meta.fields.find((field: { fieldname: string }) => field.fieldname === value);
        acc[value] = m?.label ?? value;
        return acc;
      }, {}),
    },
    viewProps: {
      rows: view.rows,
      columns: view.columns,
      totalCount: taskState.total_count,
      orderBy: {
        order: taskState.order,
        field: taskState.orderColumn,
      },
      filters: createFilter(taskState),
    },
  };
  const buttons = [
    {
      title: "Task",
      handleClick: () => {
        dispatch(setAddTaskDialog(true));
      },
      label: "Task",
      icon: Plus,
      variant: "default",
      className: "h-10 px-2 py-2",
    },
  ];
  return (
    <ListViewHeader
      filters={filters}
      showColumnSelector={true}
      columnSelector={columnSelector}
      showActions={true}
      actionProps={actions}
      buttons={buttons}
      showFilterValue
    />
  );
};
