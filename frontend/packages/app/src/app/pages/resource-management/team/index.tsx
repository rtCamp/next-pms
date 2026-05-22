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
import CustomViewWrapper from "@/app/components/customViewWrapper";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { ViewData } from "@/store/view";
import AddResourceAllocations from "../components/addAllocation";
import { ResourceTeamHeaderSection } from "./components/header";
import { ResourceTeamTable } from "./components/table";
import { createFilter } from "./utils";
import {
  ResourceContextProvider,
  ResourceFormContext,
} from "../store/resourceFormContext";
import { TeamContext, TeamContextProvider } from "../store/teamContext";
import type {
  AllocationDataProps,
  DateProps,
  EmployeeDataProps,
  ResourceTeam,
} from "../store/types";
import type { ResourceTeamAPIBodyProps } from "../timeline/types";
import { getDatesArrays } from "../utils/dates";
import { getIsBillableValue } from "../utils/helper";

const ResourceTeamViewWrapper = () => {
  return (
    <ResourceContextProvider>
      <TeamContextProvider>
        <ResourceTeamView />
      </TeamContextProvider>
    </ResourceContextProvider>
  );
};

interface ResourceTeamViewComponentProps {
  viewData: ViewData;
}

/**
 * This is main component which is responsible for rendering the team view of resource management.
 *
 * @returns React.FC
 */
const ResourceTeamView = () => {
  return (
    <CustomViewWrapper
      label="ResourceTeamView"
      createFilter={createFilter({} as ResourceTeam)}
    >
      {({ viewData }) => <ResourceTeamViewComponent viewData={viewData} />}
    </CustomViewWrapper>
  );
};

const ResourceTeamViewComponent = ({
  viewData,
}: ResourceTeamViewComponentProps) => {
  const { toast } = useToast();
  const { teamData, filters, apiController } = useContextSelector(
    TeamContext,
    (value) => value.state,
  );

  const {
    updateTeamData,
    mergeHorizontalData,
    getHasMore,
    setStart,
    setMaxWeek,
    setDates,
    setReFetchData,
  } = useContextSelector(TeamContext, (value) => value.actions);

  const {
    permission: resourceAllocationPermission,
    dialogState: resourceAllocationDialogState,
  } = useContextSelector(ResourceFormContext, (value) => value.state);

  const { call: fetchData } = useFrappePostCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data",
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
    [resourceAllocationPermission.write, filters],
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
    [fetchData, getFilterApiBody, toast],
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

    while (currentWeek <= filters.maxWeek) {
      const currentWeekCopy = currentWeek;
      handleApiCall({
        ...req,
        date: getNextDate(req.date, currentWeekCopy),
      }).then((res) => {
        if (!res) return;
        mergeHorizontalData({
          start: req.start,
          data: res.data,
          customer: res.customer,
        });
      });
      currentWeek += 5;
    }
  }, [
    filters.maxWeek,
    filters.pageLength,
    filters.start,
    filters.weekDate,
    handleApiCall,
    mergeHorizontalData,
    updateTeamData,
  ]);

  const addHorizontalPreProcessData = useCallback(
    (dates: DateProps[]) => {
      const req = {
        date: filters.weekDate,
        max_week: filters.maxWeek,
        start: filters.start,
      };

      let currentStart = 0;

      while (currentStart <= filters.start) {
        const currentStartCopy = currentStart;
        handleApiCall({
          ...req,
          start: currentStartCopy,
          date: getNextDate(req.date, req.max_week),
        }).then((res) => {
          if (!res) return;
          mergeHorizontalData({
            start: currentStartCopy,
            data: res.data,
            customer: res.customer,
            dates,
          });
        });
        currentStart += filters.pageLength;
      }
    },
    [
      filters.maxWeek,
      filters.pageLength,
      filters.start,
      filters.weekDate,
      handleApiCall,
      mergeHorizontalData,
    ],
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

    addHorizontalPreProcessData(teamData.dates);
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
            const index = newEmployeeData.findIndex(
              (employee: EmployeeDataProps) => employee.name == item.name,
            );
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
    [
      fetchData,
      filters.allocationType,
      filters.maxWeek,
      filters.weekDate,
      teamData,
      updateTeamData,
    ],
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
      addHorizontalPreProcessData(newDates);
    } else {
      addHorizontalPreProcessData(teamData.dates);
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
  }, [
    apiController.isNeedToFetchDataAfterUpdate,
    loadIntialData,
    setReFetchData,
  ]);

  return (
    <>
      <ResourceTeamHeaderSection viewData={viewData} />
      {apiController.isLoading && teamData.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceTeamTable
          handleVerticalLoadMore={handleVerticalLoadMore}
          onSubmit={onFormSubmit}
          cellHeaderRef={cellHeaderRef}
          dateToAddHeaderRef={getNextDate(
            filters.weekDate,
            filters.maxWeek - 1,
          )}
        />
      )}
      {resourceAllocationDialogState.isShowDialog && (
        <AddResourceAllocations onSubmit={onFormSubmit} />
      )}
    </>
  );
};

export default ResourceTeamViewWrapper;
