import { useCallback, useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { getDateTimeForMultipleTimeZoneSupport, parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { PermissionProps } from "@/store/resource_management/allocation";

import { ResourceTimLineHeaderSection } from "./header";
import { ResourceTimeLine } from "./timeLine";
import { ResourceAllocationEmployeeProps, ResourceAllocationTimeLineProps, ResourceTimeLineDataProps } from "./types";
import { TableContextProvider } from "../store/tableContext";
import { TimeLineContext, TimeLineContextProvider } from "../store/timeLineContext";
import { getIsBillableValue } from "../utils/helper";

interface ResourceTeamAPIBodyProps {
  date: string;
  start: number;
}

const ResourceTimeLineView = () => {
  return (
    <TableContextProvider>
      <TimeLineContextProvider>
        <ResourceTimeLineComponet />
      </TimeLineContextProvider>
    </TableContextProvider>
  );
};

const ResourceTimeLineComponet = () => {
  const { toast } = useToast();
  const {
    apiControler,
    employees,
    filters,
    updateApiControler,
    setEmployeesData,
    setCustomerData,
    setAllocationsData,
  } = useContext(TimeLineContext);

  // const resourceAllocationForm: AllocationDataProps = useSelector((state: RootState) => state.resource_allocation_form);
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
        employee_name: filters.employeeName,
        page_length: filters.page_length,
      };
      if (resourceAllocationPermission.write) {
        newReqBody = {
          ...newReqBody,
          business_unit: JSON.stringify(filters.businessUnit),
          reports_to: filters.reportingManager,
          designation: JSON.stringify(filters.designation),
          is_billable: getIsBillableValue(filters.allocationType as string[]),
          skills: filters?.skillSearch && filters?.skillSearch?.length > 0 ? JSON.stringify(filters.skillSearch) : null,
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
      date: filters.weekDate,
      start: filters.start,
    };

    const mainThredData = await handleApiCall(req);

    if (!mainThredData) return;

    const data = filterApiData(mainThredData);

    setEmployeesData(data.employees, mainThredData.has_more);
    setCustomerData(data.customer);
    setAllocationsData(data.resource_allocations);
  }, [filters.weekDate, filters.start, handleApiCall, setEmployeesData, setCustomerData, setAllocationsData]);

  useEffect(() => {
    if (apiControler.isNeedToFetchDataAfterUpdate) {
      loadIntialData();
      updateApiControler({ isNeedToFetchDataAfterUpdate: false });
    }
  }, [loadIntialData, apiControler.isNeedToFetchDataAfterUpdate, updateApiControler]);

  return (
    <>
      <ResourceTimLineHeaderSection />
      {apiControler.isLoading && employees.length == 0 ? <Spinner isFull /> : <ResourceTimeLine />}
    </>
  );
};

export default ResourceTimeLineView;
