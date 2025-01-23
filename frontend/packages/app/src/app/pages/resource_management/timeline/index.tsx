import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { getDateTimeForMultipleTimeZoneSupport, parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { PermissionProps } from "@/store/resource_management/allocation";
import { setReFetchData } from "@/store/resource_management/team";

import { ResourceTimeLine } from "./timeLine";
import { ResourceAllocationEmployeeProps, ResourceAllocationTimeLineProps, ResourceTimeLineDataProps } from "./types";
import { TableContextProvider } from "../store/tableContext";
import { TimeLineContextProvider } from "../store/timeLineContext";
import { ResourceTeamHeaderSection } from "../team/components/Header";
import { getIsBillableValue } from "../utils/helper";

interface ResourceTeamAPIBodyProps {
  date: string;
  max_week: number;
  start: number;
}

const ResourceTimeLineView = () => {
  const { toast } = useToast();
  const resourceTeamState = useSelector((state: RootState) => state.resource_team);

  const dispatch = useDispatch();

  // const resourceAllocationForm: AllocationDataProps = useSelector((state: RootState) => state.resource_allocation_form);
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );

  const [timeLineData, setTimeLineData] = useState<ResourceTimeLineDataProps>({
    employees: [],
    resource_allocations: [],
    customer: {},
  });

  const { call: fetchData, loading } = useFrappePostCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data"
  );

  const getFilterApiBody = useCallback(
    (req: ResourceTeamAPIBodyProps): ResourceTeamAPIBodyProps => {
      let newReqBody = {
        ...req,
        employee_name: resourceTeamState.employeeName,
        page_length: resourceTeamState.pageLength,
      };
      if (resourceAllocationPermission.write) {
        newReqBody = {
          ...newReqBody,
          business_unit: JSON.stringify(resourceTeamState.businessUnit),
          reports_to: resourceTeamState.reportingManager,
          designation: JSON.stringify(resourceTeamState.designation),
          is_billable: getIsBillableValue(resourceTeamState.allocationType as string[]),
          skills:
            resourceTeamState?.skillSearch && resourceTeamState?.skillSearch?.length > 0
              ? JSON.stringify(resourceTeamState.skillSearch)
              : null,
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

  const filterApiData = (data: ResourceTimeLineDataProps) => {
    const updatedData = { ...data };

    updatedData.employees = updatedData.employees.map((employee: ResourceAllocationEmployeeProps) => ({
      ...employee,
      id: employee.name,
      title: employee.employee_name,
    }));

    updatedData.resource_allocations = updatedData.resource_allocations.map(
      (allocation: ResourceAllocationTimeLineProps) => ({
        ...allocation,
        id: allocation.name,
        group: allocation.employee,
        title:
          allocation.employee_name +
          "( " +
          allocation.allocation_start_date +
          " to " +
          allocation.allocation_end_date +
          ")",
        start_time: getDateTimeForMultipleTimeZoneSupport(allocation.allocation_start_date).getTime(),
        end_time: getDateTimeForMultipleTimeZoneSupport(allocation.allocation_end_date).setDate(
          getDateTimeForMultipleTimeZoneSupport(allocation.allocation_end_date).getDate() + 1
        ),
        customerData: {
          ...updatedData.customer[allocation.customer],
        },
      })
    );

    return updatedData;
  };

  const loadIntialData = useCallback(async () => {
    const req = {
      date: resourceTeamState.weekDate,
      max_week: resourceTeamState.maxWeek,
      start: resourceTeamState.start,
    };

    const mainThredData = await handleApiCall(req);

    if (!mainThredData) return;

    setTimeLineData(filterApiData(mainThredData));
  }, [handleApiCall, resourceTeamState.maxWeek, resourceTeamState.start, resourceTeamState.weekDate]);

  useEffect(() => {
    if (resourceTeamState.isNeedToFetchDataAfterUpdate) {
      loadIntialData();
      dispatch(setReFetchData(false));
    }
  }, [dispatch, loadIntialData, resourceTeamState.isNeedToFetchDataAfterUpdate]);

  return (
    <TableContextProvider>
      <ResourceTeamHeaderSection />

      {loading ? (
        <Spinner isFull />
      ) : (
        <TimeLineContextProvider>
          <ResourceTimeLine data={timeLineData} />
        </TimeLineContextProvider>
      )}
    </TableContextProvider>
  );
};

export default ResourceTimeLineView;
