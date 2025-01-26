/**
 * External dependencies.
 */
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getNextDate } from "@next-pms/design-system";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useInfiniteScroll } from "@next-pms/hooks";
import { useFrappePostCall } from "frappe-react-sdk";
/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { AllocationDataProps, PermissionProps } from "@/store/resource_management/allocation";
import {
  ResourceTeamDataProps,
  setData,
  setDates,
  setMaxWeek,
  setReFetchData,
  setStart,
  updateData,
} from "@/store/resource_management/team";

import AddResourceAllocations from "../components/AddAllocation";
import { ResourceTeamHeaderSection } from "./components/Header";
import { ResourceTeamTable } from "./components/Table";
import { getDatesArrays } from "../utils/dates";
import { getIsBillableValue } from "../utils/helper";

interface ResourceTeamAPIBodyProps {
  date: string;
  max_week: number;
  start: number;
}

interface PreProcessDataProps extends ResourceTeamDataProps {
  date: string;
  max_week: number;
  start: number;
  page_length: number;
}

/**
 * This is main component which is responsible for rendering the team view of resource management.
 *
 * @returns React.FC
 */
const ResourceTeamView = () => {
  const { toast } = useToast();
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);
  const resourceAllocationForm: AllocationDataProps = useSelector((state: RootState) => state.resource_allocation_form);
  const dispatch = useDispatch();
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const { call: fetchData } = useFrappePostCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data"
  );

  const getFilterApiBody = useCallback(
    (req: ResourceTeamAPIBodyProps): ResourceTeamAPIBodyProps => {
      let newReqBody = {
        ...req,
        employee_name: resourceTeamState.employeeName,
        page_length: resourceTeamState.pageLength,
        need_hours_summary: true,
      };
      if (resourceAllocationPermission.write) {
        newReqBody = {
          ...newReqBody,
          business_unit: JSON.stringify(resourceTeamState.businessUnit),
          reports_to: resourceTeamState.reportingManager,
          designation: JSON.stringify(resourceTeamState.designation),
          is_billable: getIsBillableValue(resourceTeamState.allocationType as string[]),
          skills: resourceTeamState?.skillSearch?.length > 0 ? JSON.stringify(resourceTeamState.skillSearch) : null,
        };
        return newReqBody;
      }

      return newReqBody;
    },
    [resourceAllocationPermission.write, resourceTeamState]
  );

  const handleApiCall = useCallback(
    async (req: ResourceTeamAPIBodyProps) => {
      try {
        const filterReqBody: ResourceTeamAPIBodyProps = getFilterApiBody(req);
        const res = await fetchData(filterReqBody);
        return res.message;
      } catch (err) {
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
    (horizontalPreProcessData: PreProcessDataProps, data: ResourceTeamDataProps | null) => {
      if (horizontalPreProcessData) {
        let updatedTeamData = Object.assign({}, resourceTeamState.data);

        if (data) {
          updatedTeamData = Object.assign({}, data);
        }

        updatedTeamData.customer = { ...updatedTeamData.customer, ...horizontalPreProcessData.customer };

        const start = horizontalPreProcessData.start;
        const updateDate = [...updatedTeamData.data];

        for (let count = 0; count < horizontalPreProcessData.data.length; count++) {
          const dataIndex = start + count;

          const updateEmployeeData = Object.assign({}, updateDate[dataIndex]);

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

        dispatch(setData(updatedTeamData));

        return updatedTeamData;
      }
    },
    [dispatch, resourceTeamState.data]
  );

  const addVerticalPreProcessData = useCallback(async () => {
    const req = {
      date: resourceTeamState.weekDate,
      max_week: 5,
      start: resourceTeamState.start + resourceTeamState.pageLength,
    };

    const mainThredData = await handleApiCall(req);

    if (!mainThredData) return;

    dispatch(updateData(mainThredData));

    let currentWeek = 5;

    let newData: ResourceTeamDataProps = {
      data: [...resourceTeamState.data.data, ...mainThredData.data],
      customer: { ...resourceTeamState.data.customer, ...mainThredData.customer },
      dates: [],
      total_count: mainThredData.total_count,
      has_more: mainThredData.has_more,
    };

    while (currentWeek <= resourceTeamState.maxWeek) {
      const currentWeekCopy = currentWeek;
      handleApiCall({ ...req, date: getNextDate(req.date, currentWeekCopy) }).then((res) => {
        newData = updateHorizontalData(
          {
            ...res,
            date: getNextDate(req.date, currentWeekCopy),
            max_week: req.max_week,
            start: req.start,
            page_length: resourceTeamState.pageLength,
          },
          newData
        );
      });
      currentWeek += 5;
    }
  }, [
    dispatch,
    handleApiCall,
    resourceTeamState.data,
    resourceTeamState.maxWeek,
    resourceTeamState.pageLength,
    resourceTeamState.start,
    resourceTeamState.weekDate,
    updateHorizontalData,
  ]);

  const addHorizontalPreProcessData = useCallback(
    (isNeedToUpdateReqWeeks: boolean = false, data: ResourceTeamDataProps | null = null) => {
      const req = {
        date: resourceTeamState.weekDate,
        max_week: resourceTeamState.maxWeek,
        start: resourceTeamState.start,
      };

      let currentStart = 0;

      while (currentStart <= resourceTeamState.start) {
        const currentStartCopy = currentStart;
        handleApiCall({ ...req, start: currentStartCopy, date: getNextDate(req.date, req.max_week) }).then((res) => {
          data = updateHorizontalData(
            {
              ...res,
              date: getNextDate(req.date, req.max_week + (isNeedToUpdateReqWeeks ? 10 : 0)),
              max_week: req.max_week,
              start: currentStartCopy,
              page_length: resourceTeamState.pageLength,
            },
            data
          );
        });
        currentStart += resourceTeamState.pageLength;
      }
    },
    [
      handleApiCall,
      resourceTeamState.maxWeek,
      resourceTeamState.pageLength,
      resourceTeamState.start,
      resourceTeamState.weekDate,
      updateHorizontalData,
    ]
  );

  const loadIntialData = useCallback(async () => {
    const req = {
      date: resourceTeamState.weekDate,
      max_week: resourceTeamState.maxWeek,
      start: resourceTeamState.start,
    };

    const mainThredData = await handleApiCall(req);

    if (!mainThredData) return;

    dispatch(setData(mainThredData));

    addHorizontalPreProcessData(false, mainThredData);
  }, [
    addHorizontalPreProcessData,
    dispatch,
    handleApiCall,
    resourceTeamState.maxWeek,
    resourceTeamState.start,
    resourceTeamState.weekDate,
  ]);

  const handleVerticalLoadMore = () => {
    if (!resourceTeamState.hasMore) return;
    addVerticalPreProcessData();
    dispatch(setStart(resourceTeamState.start + resourceTeamState.pageLength));
  };

  const onFormSubmit = useCallback(
    (oldData: AllocationDataProps, newData: AllocationDataProps) => {
      fetchData({
        date: resourceTeamState.weekDate,
        max_week: resourceTeamState.maxWeek,
        employee_id: JSON.stringify([oldData.employee, newData.employee]),
        is_billable: getIsBillableValue(resourceTeamState.allocationType as string[]),
      }).then((res) => {
        const newEmployeeData = res.message?.data;
        if (newEmployeeData && newEmployeeData.length > 0) {
          const updatedData = resourceTeamState.data.data.map((item) => {
            const index = newEmployeeData.findIndex((employee) => employee.name == item.name);
            if (index != -1) {
              return newEmployeeData[index];
            }
            return item;
          });
          dispatch(setData({ ...resourceTeamState.data, data: updatedData, customer: res.message?.customer }));
        }
      });
    },
    [dispatch, fetchData, resourceTeamState]
  );

  const cellHeaderRef = useInfiniteScroll({
    isLoading: resourceTeamState.isLoading,
    hasMore: true,
    next: () => handleHorizontalLoadMore(),
  });

  const handleHorizontalLoadMore = () => {
    if (resourceTeamState.isLoading) return;
    addHorizontalPreProcessData(true, null);
    dispatch(setMaxWeek(resourceTeamState.maxWeek + 5));

    if (resourceTeamState.maxWeek + 5 >= 10) {
      dispatch(setDates(getDatesArrays(resourceTeamState.weekDate, resourceTeamState.maxWeek + 5)));
    }
  };

  useEffect(() => {
    if (resourceTeamState.isNeedToFetchDataAfterUpdate) {
      loadIntialData();
      dispatch(setReFetchData(false));
    }
  }, [dispatch, loadIntialData, resourceTeamState.isNeedToFetchDataAfterUpdate]);

  return (
    <>
      <ResourceTeamHeaderSection />
      {resourceTeamState.isLoading && resourceTeamState.data.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceTeamTable
          handleVerticalLoadMore={handleVerticalLoadMore}
          onSubmit={onFormSubmit}
          cellHeaderRef={cellHeaderRef}
          dateToAddHeaderRef={getNextDate(resourceTeamState.weekDate, resourceTeamState.maxWeek - 1)}
        />
      )}
      {resourceAllocationForm.isShowDialog && <AddResourceAllocations onSubmit={onFormSubmit} />}
    </>
  );
};

export default ResourceTeamView;
