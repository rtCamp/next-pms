/**
 * External dependencies
 */
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useToast } from "@next-pms/design-system/hooks";
import { useFrappeGetDocList, useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies
 */
import { Plus } from "lucide-react";
import { Header as ListViewHeader } from "@/app/components/list-view/header";
import { ButtonProps, FilterPops } from "@/app/components/list-view/types";
import { parseFrappeErrorMsg } from "@/lib/utils";
import type { RootState } from "@/store";
import {
  setCurrency,
  setIsAddProjectDialogOpen,
  setOrderBy,
  setSearch,
  setSelectedBilingType,
  setSelectedBusinessUnit,
  setSelectedProjectType,
  setSelectedStatus,
  setSelectedIndustry,
  setTag,
  Status,
} from "@/store/project";
import { updateView } from "@/store/view";
import type { sortOrder } from "@/types";
import type { HeaderProps } from "../types";
import { createFilter, getFilter } from "../utils";

export const Header = ({
  meta,
  columnOrder,
  setColumnOrder,
  onColumnHide,
  view,
  stateUpdated,
  setStateUpdated,
}: HeaderProps) => {
  const projectState = useSelector((state: RootState) => state.project);
  const user = useSelector((state: RootState) => state.user);
  const dispatch = useDispatch();
  const { toast } = useToast();

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
  const handleIndustryChange = useCallback(
    (filters: string | string[]) => {
      const normalizedFilters = Array.isArray(filters) ? filters : [filters];
      dispatch(setSelectedIndustry(normalizedFilters));
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
  const [tagSearchTerm, setTagSearchTerm] = useState<string>("");
  const [industrySearch, setIndustrySearch] = useState<string>("");

  const { data: tagData, mutate: mutateTagData } = useFrappeGetDocList("Tag", {
    filters: [["name", "like", `%${tagSearchTerm}%`]],
    limit: 5,
    asDict: false,
  });
  const [selectedTag, setSelectedTag] = useState<string[]>([]);

  useEffect(() => {
    mutateTagData();
  }, [mutateTagData, setTagSearchTerm]);

  const handleTagChange = (tag: string[]) => {
    dispatch(setTag(tag));
    setTagSearchTerm("");
    mutateTagData();
    if (tagSearchTerm.trim()) {
      setSelectedTag(tag);
    } else {
      setSelectedTag([]);
    }
  };

  let filters = [
    {
      type: "search" as FilterPops["type"],
      queryParameterName: "search",
      label: "Project Name",
      value: projectState.search,
      queryParameterDefault: projectState.search,
      handleChange: handleSearch,
      handleDelete: useCallback(() => {
        dispatch(setSearch(""));
      }, [dispatch]),
    },
    {
      type: "select-search" as FilterPops["type"],
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
      handleDelete: handleProjectTypeChange,
    },
    {
      type: "select-list" as FilterPops["type"],
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
      handleDelete: handleStatusChange,
    },
    {
      type: "select-search" as FilterPops["type"],
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
      handleDelete: handleBuChange,
      isMultiComboBox: true,
      shouldFilterComboBox: true,
    },
    {
      type: "select-list" as FilterPops["type"],
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
      handleDelete: handleBillingTypeChange,
      shouldFilterComboBox: true,
      isMultiComboBox: true,
    },
    {
      type: "select-search" as FilterPops["type"],
      queryParameterName: "industry",
      label: "Industry",
      value: projectState.selectedIndustry,
      apiCall: {
        url: "frappe.client.get_list",
        filters: {
          doctype: "Industry Type",
          fields: ["name"],
          or_filters: [["name", "like", `%${industrySearch}%`]],
          limit_page_length: 5,
        },
        options: {
          revalidateOnFocus: false,
          revalidateIfStale: false,
        },
      },
      queryParameterDefault: projectState.selectedIndustry,
      handleChange: handleIndustryChange,
      handleDelete: handleIndustryChange,
      shouldFilterComboBox: true,
      isMultiComboBox: true,
      onComboSearch: (searchTerm: string) => {
        setIndustrySearch(searchTerm);
      },
    },
    {
      type: "select-list" as FilterPops["type"],
      queryParameterName: "tag",
      label: "Tag",
      value: projectState.tag,
      data: tagData
        ?.flat()
        .concat(selectedTag)
        .map((tag) => ({
          label: tag,
          value: tag,
        })),
      queryParameterDefault: projectState.tag,
      handleChange: handleTagChange,
      handleDelete: useCallback(
        (tag: string[]) => {
          dispatch(setTag(tag));
        },
        [dispatch]
      ),
      onSearch: (searchTerm: string) => {
        setTagSearchTerm(searchTerm);
      },
      shouldFilterComboBox: true,
      isMultiComboBox: true,
    },
    {
      type: "select-list" as FilterPops["type"],
      queryParameterName: "currency",
      label: "Currency",
      value: projectState.currency,
      data: user.currencies.map((currency) => ({
        label: currency,
        value: currency,
      })),
      queryParameterDefault: projectState.currency,
      handleChange: handleCurrencyChange,
      handleDelete: useCallback(() => {
        dispatch(setCurrency(""));
      }, [dispatch]),
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
  const actions = {
    docType: meta.doctype,
    exportProps: {
      pageLength: projectState.data.length,
      totalCount: projectState.totalCount,
      orderBy: `${projectState.orderColumn}  ${projectState.order}`,
      fields: columnOrder.reduce((acc: { [key: string]: string }, value) => {
        const m = meta.fields.find((field: { fieldname: string }) => field.fieldname === value);
        if (m) {
          acc[value] = m?.label ?? value;
        }
        return acc;
      }, {}),
      filters: getFilter(projectState),
    },
    viewProps: {
      rows: view.rows,
      columns: view.columns,
      totalCount: projectState.totalCount,
      orderBy: {
        order: projectState.order,
        field: projectState.orderColumn,
      },
      filters: createFilter(projectState),
      pinnedColumns: view.pinnedColumns || [],
      isDefault: Boolean(view.default),
      isPublic: Boolean(view.public),
      name: view.name ?? "",
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
      title: "Project",
      handleClick: () => {
        dispatch(setIsAddProjectDialogOpen(true));
      },
      label: "Project",
      icon: Plus,
      variant: "default" as ButtonProps["variant"],
      className: "h-10 px-2 py-2",
    },
  ];
  if (!user.hasBuField) {
    filters = filters.filter((filter) => filter.queryParameterName !== "business-unit");
  }

  return (
    <ListViewHeader
      filters={filters}
      showSort={true}
      sort={sortOptions}
      showColumnSelector={true}
      columnSelector={columnSelector}
      showActions={true}
      actionProps={actions}
      showFilterValue
      buttons={buttons}
    />
  );
};
