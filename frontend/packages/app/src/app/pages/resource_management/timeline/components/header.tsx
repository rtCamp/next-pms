/**
 * External dependencies.
 */
import { useContext, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getMonthKey, getMonthYearKey, getTodayDate, prettyDate } from "@next-pms/design-system";
import { TableHead, Typography } from "@next-pms/design-system/components";
import { useQueryParam } from "@next-pms/hooks";
import { startOfWeek } from "date-fns";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
import { Plus, ZoomIn, ZoomOut } from "lucide-react";
import { Moment } from "moment";

/**
 * Internal dependencies.
 */
import { Header } from "@/app/components/list-view/header";
import { cn } from "@/lib/utils";
import { RootState } from "@/store";
import { PermissionProps, setDialog, setResourcePermissions } from "@/store/resource_management/allocation";
import { Skill } from "@/store/resource_management/team";

import { TableContext } from "../../store/tableContext";
import { TimeLineContext } from "../../store/timeLineContext";
import SkillSearch from "../../team/components/skillSearch";
import { getDayKeyOfMoment } from "../../utils/dates";
import { ResourceAllocationItemProps } from "../types";

interface TimeLineHeaderFunctionProps {
  getIntervalProps: () => ResourceAllocationItemProps;
  intervalContext: { interval: { startTime: Moment; endTime: Moment } };
  data: { unit: string; showYear?: boolean };
}

/**
 * This component is responsible for loading the team view header.
 *
 * @returns React.FC
 */
const ResourceTimLineHeaderSection = () => {
  const [businessUnitParam] = useQueryParam<string[]>("business-unit", []);
  const [employeeNameParam] = useQueryParam<string>("employee-name", "");
  const [reportingNameParam] = useQueryParam<string>("reports-to", "");
  const [allocationTypeParam] = useQueryParam<string[]>("allocation-type", []);
  const [designationParam] = useQueryParam<string[]>("designation", []);
  const [skillSearchParam, setSkillSearchParam] = useQueryParam<Skill[]>("skill-search", []);

  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );
  const dispatch = useDispatch();

  const { data: employee } = useFrappeGetCall("next_pms.timesheet.api.employee.get_employee", {
    filters: { name: reportingNameParam },
  });

  const { updateFilters, filters } = useContext(TimeLineContext);

  const { call, loading } = useFrappePostCall(
    "next_pms.resource_management.api.permission.get_user_resources_permissions"
  );

  useEffect(() => {
    if (Object.keys(resourceAllocationPermission).length != 0) {
      updateData();
      return;
    }
    if (loading) return;

    call({}).then((res: { message: PermissionProps }) => {
      const resResourceAllocationPermission = res.message;
      dispatch(setResourcePermissions(resResourceAllocationPermission));
      updateData();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateData = () => {
    updateFilters({
      businessUnit: businessUnitParam,
      employeeName: employeeNameParam,
      reportingManager: reportingNameParam,
      designation: designationParam,
      allocationType: allocationTypeParam,
      skillSearch: skillSearchParam,
    });
  };

  return (
    <Header
      filters={[
        {
          queryParameterName: "employee-name",
          handleChange: (value: string) => {
            updateFilters({ employeeName: value });
          },
          handleDelete: () => {
            updateFilters({ employeeName: "" });
          },
          type: "search",
          value: filters.employeeName,
          defaultValue: "",
          label: "Employee Name",
          queryParameterDefault: "",
        },
        {
          queryParameterName: "reports-to",
          handleChange: (value: string | string[]) => {
            updateFilters({ reportingManager: value as string });
          },
          handleDelete: () => {
            updateFilters({ reportingManager: "" });
          },
          type: "search-employee",
          value: filters.reportingManager,
          defaultValue: "",
          label: "Reporting Manager",
          hide: !resourceAllocationPermission.write,
          queryParameterDefault: [],
          employeeName: employee?.message?.employee_name,
        },
        {
          type: "custom-filter",
          queryParameterDefault: [],
          label: "Skill",
          handleDelete: (value: string[]) => {
            let prev_data = filters?.skillSearch;
            const operators = [">", "<", ">=", "<=", "="];
            const skills = value.map((value) => {
              for (const operator of operators) {
                if (value.includes(` ${operator} `)) {
                  return value.split(` ${operator} `)[0].trim();
                }
              }
              return value.trim();
            });
            prev_data = prev_data!.filter((obj) => skills.includes(obj.name));
            updateFilters({ skillSearch: prev_data });
          },
          value: filters.skillSearch?.map((obj) => obj.name + " " + obj.operator + " " + obj.proficiency * 5),
          hide: !resourceAllocationPermission.write,
          customFilterComponent: (
            <SkillSearch
              onSubmit={(skills) => {
                updateFilters({ skillSearch: skills });
              }}
              setSkillSearchParam={setSkillSearchParam}
              skillSearch={filters.skillSearch as Skill[]}
            />
          ),
        },
        {
          queryParameterName: "business-unit",
          handleChange: (value: string | string[]) => {
            updateFilters({ businessUnit: value as string[] });
          },
          handleDelete: (value: string[] | undefined) => {
            updateFilters({ businessUnit: value as string[] });
          },
          type: "select-search",
          value: filters.businessUnit,
          label: "Business Unit",
          shouldFilterComboBox: true,
          isMultiComboBox: true,
          hide: !resourceAllocationPermission.write,
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
          queryParameterDefault: filters.businessUnit,
        },
        {
          queryParameterName: "designation",
          handleChange: (value: string | string[]) => {
            updateFilters({ designation: value as string[] });
          },
          handleDelete: (value: string[] | undefined) => {
            updateFilters({ designation: value as string[] });
          },
          type: "select-search",
          value: filters.designation,
          shouldFilterComboBox: true,
          isMultiComboBox: true,
          label: "Designation",
          hide: !resourceAllocationPermission.write,
          apiCall: {
            url: "frappe.client.get_list",
            filters: {
              doctype: "Designation",
              filter: { custom_enabled: true },
              fields: ["name"],
              limit_page_length: 0,
            },
            options: {
              revalidateOnFocus: false,
              revalidateIfStale: false,
            },
          },
          queryParameterDefault: filters.designation,
        },
        {
          queryParameterName: "allocation-type",
          handleChange: (value: string | string[]) => {
            updateFilters({ allocationType: value as string[] });
          },
          handleDelete: (value: string[] | undefined) => {
            updateFilters({ allocationType: value as string[] });
          },
          type: "select-list",
          value: filters.allocationType,
          shouldFilterComboBox: true,
          isMultiComboBox: true,
          label: "Allocation Type",
          data: [
            {
              label: "Billable",
              value: "Billable",
            },
            {
              label: "Non-Billable",
              value: "Non-Billable",
            },
          ],
          queryParameterDefault: filters.allocationType,
          hide: !resourceAllocationPermission.write,
        },
      ]}
      buttons={[
        {
          title: "add-allocation",
          handleClick: () => {
            dispatch(setDialog(true));
          },
          className: "px-3",
          icon: () => <Plus className="w-4 max-md:w-3 h-4 max-md:h-3 bg" />,
          variant: "default",
          hide: !resourceAllocationPermission.write,
        },
        {
          title: "Zoom In",
          handleClick: () => {
            updateFilters({ isShowMonth: true });
          },
          className: "px-3",
          icon: () => <ZoomIn className="w-4 max-md:w-3 h-4 max-md:h-3 bg" />,
          variant: "outline",
          hide: !resourceAllocationPermission.write,
          disabled: filters.isShowMonth,
        },
        {
          title: "Zoom Out",
          handleClick: () => {
            updateFilters({ isShowMonth: false });
          },
          className: "px-3",
          icon: () => <ZoomOut className="w-4 max-md:w-3 h-4 max-md:h-3 bg" />,
          variant: "outline",
          hide: !resourceAllocationPermission.write,
          disabled: !filters.isShowMonth,
        },
      ]}
      showFilterValue
    />
  );
};

const TimeLineIntervalHeader = ({ getIntervalProps, intervalContext, data }: TimeLineHeaderFunctionProps) => {
  const { interval } = intervalContext;
  const { startTime, endTime } = interval;
  const start = startOfWeek(getTodayDate(), {
    weekStartsOn: 1,
  });

  const getKey = () => {
    const keys = { week: "Week", month: "Month", year: "Year" };

    if (start.getTime() >= startTime.toDate().getTime() && start.getTime() <= endTime.toDate().getTime()) {
      if (data.unit === "week") {
        return `This ${keys[data.unit]}`;
      }
    }
    if (data.unit === "month" && data.showYear) {
      return getMonthYearKey(getDayKeyOfMoment(startTime));
    }

    return `${getMonthKey(getDayKeyOfMoment(startTime))} - ${getMonthKey(
      getDayKeyOfMoment(endTime.add("-1", "days"))
    )}`;
  };

  let headerProps: ResourceAllocationItemProps = getIntervalProps();

  headerProps = {
    ...headerProps,
    style: {
      ...headerProps.style,
      left: headerProps.style.left + (data.unit === "week" ? 1 : -0.5),
    },
  };

  return (
    <TableHead
      {...headerProps}
      className={cn("h-full pb-2 pt-1 px-0 text-center truncate cursor-pointer border-r border-gray-300")}
    >
      <Typography variant="small">{getKey()}</Typography>
    </TableHead>
  );
};

const TimeLineDateHeader = ({ getIntervalProps, intervalContext }: TimeLineHeaderFunctionProps) => {
  const { interval } = intervalContext;
  const { startTime } = interval;
  const { date: dateStr, day } = prettyDate(getDayKeyOfMoment(startTime));
  const { date: toDayStr } = prettyDate(getTodayDate());

  const { tableProperties, getCellWidthString } = useContext(TableContext);

  let headerProps: ResourceAllocationItemProps = getIntervalProps();

  headerProps = {
    ...headerProps,
    style: {
      ...headerProps.style,
      width: getCellWidthString(tableProperties.cellWidth),
    },
  };

  return (
    <TableHead
      {...headerProps}
      className={cn(
        "text-xs flex flex-col justify-end items-center border-0 p-0 h-full pb-2",
        day == "Sun" && "border-l border-gray-300",
        dateStr == toDayStr && "font-semibold"
      )}
    >
      <div className={cn("text-xs flex flex-col justify-end items-center pr-2")}>
        <Typography variant="p" className={cn("text-slate-600 text-[11px] ", dateStr == toDayStr && "font-semibold")}>
          {day}
        </Typography>
        <Typography
          variant="small"
          className={cn(
            "text-slate-500 text-center text-[11px] max-lg:text-[0.65rem]",
            dateStr == toDayStr && "font-semibold"
          )}
        >
          {dateStr}
        </Typography>
      </div>
    </TableHead>
  );
};

export { TimeLineIntervalHeader, TimeLineDateHeader, ResourceTimLineHeaderSection };
