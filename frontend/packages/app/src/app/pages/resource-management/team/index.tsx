/**
 * External dependencies.
 */
import { useCallback, useEffect } from "react";
import { getNextDate } from "@next-pms/design-system";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useInfiniteScroll } from "@next-pms/hooks";
import { useFrappePostCall } from "frappe-react-sdk";
import { useContextSelector } from "use-context-selector";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import AddResourceAllocations from "../components/addAllocation";
import { ResourceTeamHeaderSection } from "./components/header";
import { ResourceTeamTable } from "./components/table";
import { ResourceContextProvider, ResourceFormContext } from "../store/resourceFormContext";
import { TeamContext, TeamContextProvider } from "../store/teamContext";
import type { AllocationDataProps, DateProps, EmployeeDataProps, ResourceTeamDataProps } from "../store/types";
import type { ResourceTeamAPIBodyProps } from "../timeline/types";
import { getDatesArrays } from "../utils/dates";
import { getIsBillableValue } from "../utils/helper";
import type { PreProcessDataProps } from "./components/types";

const ResourceTeamViewWrapper = () => {
  return (
    <ResourceContextProvider>
      <TeamContextProvider>
        <ResourceTeamView />
      </TeamContextProvider>
    </ResourceContextProvider>
  );
};

/**
 * This is main component which is responsible for rendering the team view of resource management.
 *
 * @returns React.FC
 */
const ResourceTeamView = () => {
  const { toast } = useToast();
  const { teamData, filters, apiController } = useContextSelector(TeamContext, (value) => value.state);

  const { updateTeamData, getHasMore, setStart, setMaxWeek, setDates, setReFetchData } = useContextSelector(
    TeamContext,
    (value) => value.actions
  );

  const { permission: resourceAllocationPermission, dialogState: resourceAllocationDialogState } = useContextSelector(
    ResourceFormContext,
    (value) => value.state
  );

  const { call: fetchData } = useFrappePostCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data"
  );

  const getFilterApiBody = useCallback(
    (req: ResourceTeamAPIBodyProps): ResourceTeamAPIBodyProps => {
      let newReqBody = {
        ...req,
        employee_name: filters.employeeName,
        page_length: filters.pageLength,
        need_hours_summary: true,
      };
      if (resourceAllocationPermission.write) {
        newReqBody = {
          ...newReqBody,
          business_unit: JSON.stringify(filters.businessUnit),
          reports_to: filters.reportingManager,
          designation: JSON.stringify(filters.designation),
          is_billable: getIsBillableValue(filters.allocationType as string[]),
          skills:
            filters?.skillSearch?.length && filters?.skillSearch?.length > 0
              ? JSON.stringify(filters.skillSearch)
              : "[]",
          need_hours_summary: true,
        };
        return newReqBody;
      }

      return newReqBody;
    },
    [resourceAllocationPermission.write, filters]
  );

  const handleApiCall = useCallback(
    async (req: ResourceTeamAPIBodyProps) => {
      try {
        const filterReqBody: ResourceTeamAPIBodyProps = getFilterApiBody(req);
        const res = await fetchData(filterReqBody);
        return res.message;
      } catch (err) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Ignore type checking for parseFrappeErrorMsg
        const error = parseFrappeErrorMsg(err);
        toast({
          variant: "destructive",
          description: error,
        });
        return null;
      }
    },
    [fetchData, getFilterApiBody, toast]
  );

  const updateHorizontalData = useCallback(
    (horizontalPreProcessData: PreProcessDataProps, data: ResourceTeamDataProps | null, dates: DateProps[]) => {
      if (horizontalPreProcessData) {
        let updatedTeamData = teamData;

        if (data) {
          updatedTeamData = data;
        }

        updatedTeamData.customer = { ...updatedTeamData.customer, ...horizontalPreProcessData.customer };

        const start = horizontalPreProcessData.start;
        const updateDate = [...updatedTeamData.data];

        for (let count = 0; count < horizontalPreProcessData.data.length; count++) {
          const dataIndex = start + count;

          const updateEmployeeData = updateDate[dataIndex];

          updateEmployeeData.all_dates_data = {
            ...updateEmployeeData.all_dates_data,
            ...horizontalPreProcessData.data[count].all_dates_data,
          };
          updateEmployeeData.all_leave_data = {
            ...updateEmployeeData.all_leave_data,
            ...horizontalPreProcessData.data[count].all_leave_data,
          };
          updateEmployeeData.all_week_data = {
            ...updateEmployeeData.all_week_data,
            ...horizontalPreProcessData.data[count].all_week_data,
          };
          updateEmployeeData.employee_allocations = {
            ...updateEmployeeData.employee_allocations,
            ...horizontalPreProcessData.data[count].employee_allocations,
          };

          updateDate[dataIndex] = updateEmployeeData;
        }

        updatedTeamData.data = updateDate;

        updateTeamData({ ...updatedTeamData, dates: dates });

        return updatedTeamData;
      }
    },
    [teamData, updateTeamData]
  );

  const addVerticalPreProcessData = useCallback(async () => {
    const req = {
      date: filters.weekDate,
      max_week: 5,
      start: filters.start + filters.pageLength,
    };

    const mainThredData = await handleApiCall(req);

    if (!mainThredData) return;

    updateTeamData(mainThredData, "UPDATE");

    let currentWeek = 5;

    let newData: ResourceTeamDataProps = {
      data: [...teamData.data, ...mainThredData.data],
      customer: { ...teamData.customer, ...mainThredData.customer },
      dates: [],
      total_count: mainThredData.total_count,
      has_more: mainThredData.has_more,
    };

    while (currentWeek <= filters.maxWeek) {
      const currentWeekCopy = currentWeek;
      handleApiCall({ ...req, date: getNextDate(req.date, currentWeekCopy) }).then((res) => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore: Ignore type checking for the following line
        newData = updateHorizontalData(
          {
            ...res,
            date: getNextDate(req.date, currentWeekCopy),
            max_week: req.max_week,
            start: req.start,
            page_length: filters.pageLength,
          },
          newData
        );
      });
      currentWeek += 5;
    }
  }, [
    filters.maxWeek,
    filters.pageLength,
    filters.start,
    filters.weekDate,
    handleApiCall,
    teamData.customer,
    teamData.data,
    updateHorizontalData,
    updateTeamData,
  ]);

  const addHorizontalPreProcessData = useCallback(
    (isNeedToUpdateReqWeeks: boolean = false, data: ResourceTeamDataProps | null = null, dates: DateProps[]) => {
      const req = {
        date: filters.weekDate,
        max_week: filters.maxWeek,
        start: filters.start,
      };

      let currentStart = 0;

      while (currentStart <= filters.start) {
        const currentStartCopy = currentStart;
        handleApiCall({ ...req, start: currentStartCopy, date: getNextDate(req.date, req.max_week) }).then((res) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore: Ignore type checking for the following line
          data = updateHorizontalData(
            {
              ...res,
              date: getNextDate(req.date, req.max_week + (isNeedToUpdateReqWeeks ? 10 : 0)),
              max_week: req.max_week,
              start: currentStartCopy,
              page_length: filters.pageLength,
            },
            data,
            dates
          );
        });
        currentStart += filters.pageLength;
      }
    },
    [filters.maxWeek, filters.pageLength, filters.start, filters.weekDate, handleApiCall, updateHorizontalData]
  );

  const loadIntialData = useCallback(async () => {
    const req = {
      date: filters.weekDate,
      max_week: filters.maxWeek,
      start: filters.start,
    };

    const mainThredData = await handleApiCall(req);

    if (!mainThredData) return;

    updateTeamData(mainThredData);

    addHorizontalPreProcessData(false, mainThredData, teamData.dates);
  }, [
    addHorizontalPreProcessData,
    filters.maxWeek,
    filters.start,
    filters.weekDate,
    handleApiCall,
    teamData.dates,
    updateTeamData,
  ]);

  const handleVerticalLoadMore = () => {
    if (!getHasMore()) return;
    addVerticalPreProcessData();
    setStart(filters.start + filters.pageLength);
  };

  const onFormSubmit = useCallback(
    (oldData: AllocationDataProps, newData: AllocationDataProps) => {
      fetchData({
        date: filters.weekDate,
        max_week: filters.maxWeek,
        employee_id: JSON.stringify([oldData.employee, newData.employee]),
        is_billable: getIsBillableValue(filters.allocationType as string[]),
        need_hours_summary: true,
      }).then((res) => {
        const newEmployeeData = res.message?.data;
        if (newEmployeeData && newEmployeeData.length > 0) {
          const updatedData = teamData.data.map((item) => {
            const index = newEmployeeData.findIndex((employee: EmployeeDataProps) => employee.name == item.name);
            if (index != -1) {
              return newEmployeeData[index];
            }
            return item;
          });
          updateTeamData({
            ...teamData,
            data: updatedData,
            customer: { ...teamData.customer, ...res.message?.customer },
          });
        }
      });
    },
    [fetchData, filters.allocationType, filters.maxWeek, filters.weekDate, teamData, updateTeamData]
  );

  const cellHeaderRef = useInfiniteScroll({
    isLoading: apiController.isLoading,
    hasMore: true,
    next: () => handleHorizontalLoadMore(),
  });

  const handleHorizontalLoadMore = useCallback(() => {
    if (apiController.isLoading) return;
    setMaxWeek(filters.maxWeek + 5);

    if (filters.maxWeek + 5 >= 10) {
      const newDates = getDatesArrays(filters.weekDate, filters.maxWeek + 5);
      setDates(newDates);
      addHorizontalPreProcessData(true, null, newDates);
    } else {
      addHorizontalPreProcessData(true, null, teamData.dates);
    }
  }, [
    apiController.isLoading,
    filters.maxWeek,
    filters.weekDate,
    setMaxWeek,
    setDates,
    addHorizontalPreProcessData,
    teamData.dates,
  ]);

  useEffect(() => {
    if (apiController.isNeedToFetchDataAfterUpdate) {
      loadIntialData();
      setReFetchData(false);
    }
  }, [apiController.isNeedToFetchDataAfterUpdate, loadIntialData, setReFetchData]);

  return (
    <>
      <ResourceTeamHeaderSection />
      {apiController.isLoading && teamData.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceTeamTable
          handleVerticalLoadMore={handleVerticalLoadMore}
          onSubmit={onFormSubmit}
          cellHeaderRef={cellHeaderRef}
          dateToAddHeaderRef={getNextDate(filters.weekDate, filters.maxWeek - 1)}
        />
      )}
      {resourceAllocationDialogState.isShowDialog && <AddResourceAllocations onSubmit={onFormSubmit} />}
    </>
  );
};

export default ResourceTeamViewWrapper;
