import {
  setWeekDate,
  setProjectName,
  setFilters,
  resetState,
  setCombineWeekHours,
  setView,
  setIsBillable,
  setReportingManager,
  setCustomer,
} from "@/store/resource_management/project";
import { getFormatedDate } from "@/lib/utils";
import { useCallback, useEffect } from "react";
import { addDays } from "date-fns";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/store";
import { useQueryParamsState } from "@/lib/queryParam";
import { ResourceHeaderSection } from "../../components/Header";
import { ChevronLeftIcon, ChevronRight, Plus } from "lucide-react";
import { PermissionProps, setDialog } from "@/store/resource_management/allocation";

const ResourceProjectHeaderSection = () => {
  const [projectNameParam] = useQueryParamsState<string>("prject-name", "");
  const [combineWeekHoursParam, setCombineWeekHoursParam] = useQueryParamsState<boolean>("combine-week-hours", false);
  const [reportingNameParam] = useQueryParamsState<string>("reports-to", "");
  const [customerNameParam] = useQueryParamsState<string[]>("customer", []);
  const [allocationTypeParam] = useQueryParamsState<string[]>("allocation-type", []);
  const [viewParam, setViewParam] = useQueryParamsState<string>("view-type", "");

  const resourceTeamState = useSelector((state: RootState) => state.resource_project);
  const resourceTeamStateTableView = resourceTeamState.tableView;
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setIsBillable(allocationTypeParam));
    let CurrentViewParam = "";
    if (resourceAllocationPermission.write) {
      if (!viewParam) {
        CurrentViewParam = "planned";
        setViewParam(CurrentViewParam);
      }
    }
    dispatch(
      setFilters({
        projectName: projectNameParam,
        customer: customerNameParam,
        reportingManager: reportingNameParam,
        view: CurrentViewParam,
        combineWeekHours: combineWeekHoursParam,
      })
    );
    return () => {
      dispatch(resetState());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAllocationTypeChange = useCallback(
    (value: string | string[]) => {
      dispatch(setIsBillable(value as string[]));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const handleReportingManagerChange = useCallback(
    (value: string | string[]) => {
      dispatch(setReportingManager(value as string));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const handleCustomerChange = useCallback(
    (value: string | string[]) => {
      dispatch(setCustomer(value as string[]));
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [dispatch]
  );

  const handlePrevWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceTeamState.data.dates[0].start_date, -3));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceTeamState.data.dates]);

  const handleNextWeek = useCallback(() => {
    const date = getFormatedDate(addDays(resourceTeamState.data.dates[0].end_date, +1));
    dispatch(setWeekDate(date));
  }, [dispatch, resourceTeamState.data.dates]);

  const handleProjectChange = useCallback(
    (value: string) => {
      dispatch(setProjectName(value));
    },
    [dispatch]
  );

  const handleViewChange = useCallback(
    (value: string) => {
      dispatch(setView(value));
    },
    [dispatch]
  );

  const handleWeekViewChange = useCallback(() => {
    setCombineWeekHoursParam(!resourceTeamStateTableView.combineWeekHours);
    dispatch(setCombineWeekHours(!resourceTeamStateTableView.combineWeekHours));
  }, [dispatch, resourceTeamStateTableView.combineWeekHours, setCombineWeekHoursParam]);

  return (
    <ResourceHeaderSection
      filters={[
        {
          queryParameterName: "project-name",
          handleChange: handleProjectChange,
          type: "search",
          value: projectNameParam,
          defaultValue: "",
          label: "Project Name",
          queryParameterDefault: "",
        },
        {
          queryParameterName: "customer",
          handleChange: handleCustomerChange,
          type: "select-search",
          value: customerNameParam,
          defaultValue: "",
          label: "Customer",
          hide: !resourceAllocationPermission.write,
          apiCall: {
            url: "frappe.client.get_list",
            filters: {
              doctype: "Customer",
              fields: ["name"],
              limit_page_length: 0,
            },
            options: {
              revalidateOnFocus: false,
              revalidateIfStale: false,
            },
          },
          queryParameterDefault: [],
        },
        // {
        //   queryParameterName: "reports-to",
        //   handleChange: handleReportingManagerChange,
        //   type: "search-employee",
        //   value: reportingNameParam,
        //   defaultValue: "",
        //   label: "Reporting Manager",
        //   hide: !resourceAllocationPermission.write,
        //   queryParameterDefault: [],
        // },
        {
          queryParameterName: "allocation-type",
          handleChange: handleAllocationTypeChange,
          type: "select-search",
          value: allocationTypeParam,
          defaultValue: "",
          label: "Allocation Type",
          data: [
            {
              label: "Billable",
              value: "billable",
            },
            {
              label: "Non-Billable",
              value: "non-billable",
            },
          ],
          queryParameterDefault: "",
        },
        {
          queryParameterName: "view-type",
          handleChange: handleViewChange,
          type: "select",
          value: resourceTeamStateTableView.view,
          defaultValue: "planned",
          label: "Views",
          data: [
            {
              label: "Planned",
              value: "planned",
            },
            {
              label: "Actual vs Planned",
              value: "actual-vs-planned",
            },
          ],
          hide: !resourceAllocationPermission.write,
          queryParameterDefault: "planned",
        },
        {
          queryParameterName: "combine-week-hours",
          handleChange: handleWeekViewChange,
          type: "checkbox",
          value: resourceTeamStateTableView.combineWeekHours,
          defaultValue: false,
          label: "Combine Week Hours",
          queryParameterDefault: false,
        },
      ]}
      buttons={[
        {
          title: "add-allocation",
          handleClick: () => {
            dispatch(setDialog(true));
          },
          icon: () => <Plus className="w-4 max-md:w-3 h-4 max-md:h-3" />,
          variant: "default",
          hide: !resourceAllocationPermission.write,
        },
        {
          title: "previous-week",
          handleClick: handlePrevWeek,
          icon: () => <ChevronLeftIcon className="w-4 max-md:w-3 h-4 max-md:h-3" />,
        },
        {
          title: "next-week",
          handleClick: handleNextWeek,
          icon: () => <ChevronRight className="w-4 max-md:w-3 h-4 max-md:h-3" />,
        },
      ]}
    />
  );
};

export { ResourceProjectHeaderSection };
