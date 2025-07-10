/**
 * External dependencies
 */
import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useToast } from "@next-pms/design-system/components";
import { useFrappePostCall } from "frappe-react-sdk";
import { Plus } from "lucide-react";
/**
 * Internal dependencies
 */
import { Header as ListViewHeader } from "@/app/components/list-view/header";
import { FilterPops, ButtonProps } from "@/app/components/list-view/types";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { updateView } from "@/store/view";
import { TaskStatusType } from "@/types/task";
import { createFilter, getFilter } from "../utils";
import type { HeaderProps } from "./types";

export const Header = ({
  meta,
  columnOrder,
  setColumnOrder,
  onColumnHide,
  view,
  stateUpdated,
  setStateUpdated,
  taskState,
  taskDispatch,
}: HeaderProps) => {
  const [projectSearch, setProjectSeach] = useState<string>("");
  const { toast } = useToast();
  const dispatch = useDispatch();

  // frappe-call for updating view
  const { call } = useFrappePostCall("next_pms.timesheet.doctype.pms_view_setting.pms_view_setting.update_view");

  // Handle save changes
  const handleSaveChanges = () => {
    call({
      view: view,
    })
      .then((res) => {
        dispatch(updateView(res.message));
        toast({
          variant: "success",
          description: "View Updated",
        });
        setStateUpdated(false);
      })
      .catch((err) => {
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
      });
  };

  const handleSearch = (text: string) => {
    taskDispatch({ type: "SET_SEARCH", payload: text });
  };
  const handleProjectChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      taskDispatch({ type: "SET_SELECTED_PROJECT", payload: normalizedFilters });
    },
    [taskDispatch]
  );
  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      taskDispatch({ type: "SET_SELECTED_STATUS", payload: normalizedFilters as TaskStatusType[] });
    },
    [taskDispatch]
  );
  const filters = [
    {
      type: "search" as FilterPops["type"],
      queryParameterName: "search",
      label: "Subject",
      value: taskState.search,
      queryParameterDefault: taskState.search,
      handleChange: handleSearch,
      handleDelete: useCallback(() => {
        taskDispatch({ type: "SET_SEARCH", payload: "" });
      }, [taskDispatch]),
    },
    {
      type: "select-search" as FilterPops["type"],
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
      type: "select-list" as FilterPops["type"],
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
        if (m) {
          acc[value] = m?.label ?? value;
        }
        return acc;
      }, {}),
      filters: getFilter(taskState),
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
      pinnedColumns: view.pinnedColumns || [],
      isDefault: Boolean(view.default),
      isPublic: Boolean(view.public),
    },
  };
  const buttons = [
    {
      title: "Save changes",
      handleClick: () => {
        handleSaveChanges();
      },
      hide: !stateUpdated,
      label: "Save changes",
      variant: "ghost" as ButtonProps["variant"],
      className: "h-10 px-2 py-2",
    },
    {
      title: "Task",
      handleClick: () => {
        taskDispatch({ type: "SET_ADD_TASK_DIALOG", payload: true });
      },
      label: "Task",
      icon: Plus,
      variant: "default" as ButtonProps["variant"],
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
