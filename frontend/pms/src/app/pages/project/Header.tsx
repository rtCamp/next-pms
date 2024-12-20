/**
 * External dependencies
 */
import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
/**
 * Internal dependencies
 */
import { Header as ListViewHeader } from "@/app/components/listview/header";
import { RootState } from "@/store";
import {
  setCurrency,
  setOrderBy,
  setSearch,
  setSelectedBilingType,
  setSelectedBusinessUnit,
  setSelectedProjectType,
  setSelectedStatus,
  Status,
} from "@/store/project";
import { DocMetaProps, sortOrder } from "@/types";

interface HeaderProps {
  meta: DocMetaProps;
  columnOrder: Array<string>;
  setColumnOrder: React.Dispatch<React.SetStateAction<string[]>>;
  onColumnHide: (column: string) => void;
}
export const Header = ({ meta, columnOrder, setColumnOrder, onColumnHide }: HeaderProps) => {
  const projectState = useSelector((state: RootState) => state.project);
  const appInfo = useSelector((state: RootState) => state.app);
  const dispatch = useDispatch();

  const handleSearch = useCallback(
    (text: string) => {
      dispatch(setSearch(text.trim()));
    },
    [dispatch]
  );

  const handleProjectTypeChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedProjectType(normalizedFilters));
    },
    [dispatch]
  );
  const handleStatusChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedStatus(normalizedFilters as Status[]));
    },
    [dispatch]
  );
  const handleBuChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedBusinessUnit(normalizedFilters));
    },

    [dispatch]
  );
  const handleBillingTypeChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedBilingType(normalizedFilters as Status[]));
    },

    [dispatch]
  );
  const handleCurrencyChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters[0] : filters;
      dispatch(setCurrency(normalizedFilters ?? ""));
    },

    [dispatch]
  );
  const handleSortChange = (order: sortOrder, orderColumn: string) => {
    dispatch(setOrderBy({ order, orderColumn }));
  };

  const filters = [
    {
      type: "search",
      queryParameterName: "search",
      label: "Project Name",
      value: projectState.search,
      queryParameterDefault: projectState.search,
      handleChange: handleSearch,
    },
    {
      type: "select-search",
      queryParameterName: "project-type",
      label: "Project Type",
      value: projectState.selectedProjectType,
      apiCall: {
        url: "frappe.client.get_list",
        filters: {
          doctype: "Project Type",
          fields: ["name"],
          limit_page_length: 0,
        },
        options: {
          revalidateOnFocus: false,
          revalidateIfStale: false,
        },
      },
      queryParameterDefault: projectState.selectedProjectType,
      handleChange: handleProjectTypeChange,
      shouldFilterComboBox: true,
      isMultiComboBox: true,
    },
    {
      type: "select-list",
      queryParameterName: "status",
      label: "Status",
      value: projectState.selectedStatus,
      data: [
        { label: "Open", value: "Open" },
        { label: "Completed", value: "Completed" },
        { label: "Cancelled", value: "Cancelled" },
      ],
      queryParameterDefault: projectState.selectedStatus,
      handleChange: handleStatusChange,
      shouldFilterComboBox: true,
      isMultiComboBox: true,
    },
    {
      type: "select-search",
      queryParameterName: "business-unit",
      label: "Business Unit",
      value: projectState.selectedBusinessUnit,
      apiCall: {
        url: "frappe.client.get_list",
        filters: {
          doctype: "Business Unit",
          fields: ["name"],
          limit_page_length: 0,
        },
        options: {
          revalidateOnFocus: false,
          revalidateIfStale: false,
        },
      },
      queryParameterDefault: projectState.selectedBusinessUnit,
      handleChange: handleBuChange,
      isMultiComboBox: true,
      shouldFilterComboBox: true,
    },
    {
      type: "select-list",
      queryParameterName: "billing-type",
      label: "Billing Type",
      value: projectState.selectedBillingType,
      data: [
        { label: "Non-Billable", value: "Non-Billable" },
        { label: "Retainer", value: "Retainer" },
        { label: "Fixed Cost", value: "Fixed Cost" },
        { label: "Time and Material", value: "Time and Material" },
      ],
      queryParameterDefault: projectState.selectedBillingType,
      handleChange: handleBillingTypeChange,
      shouldFilterComboBox: true,
      isMultiComboBox: true,
    },
    {
      type: "select-list",
      queryParameterName: "currency",
      label: "Currency",
      value: projectState.currency,
      data: appInfo.currencies.map((currency) => ({
        label: currency,
        value: currency,
      })),
      queryParameterDefault: projectState.currency,
      handleChange: handleCurrencyChange,
      shouldFilterComboBox: true,
      isMultiComboBox: false,
    },
  ];
  const sortOptions = {
    fieldMeta: meta.fields,
    orderBy: projectState.order,
    field: projectState.orderColumn,
    onSortChange: handleSortChange,
  };
  const columnSelector = {
    fieldMeta: meta.fields,
    columnOrder,
    setColumnOrder,
    onColumnHide: onColumnHide,
  };
  return (
    <ListViewHeader
      filters={filters}
      showSort={true}
      sort={sortOptions}
      showColumnSelector={true}
      columnSelector={columnSelector}
    />
  );
};
