/**
 * External dependencies.
 */
import { useCallback, useContext, useEffect } from "react";
import { useSelector } from "react-redux";
import { getUTCDateTime } from "@next-pms/design-system";
import { Spinner, useToast } from "@next-pms/design-system/components";
import { useFrappePostCall } from "frappe-react-sdk";

/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { AllocationDataProps, PermissionProps } from "@/store/resource_management/allocation";

import { ResourceTimLineHeaderSection } from "./components/header";
import { ResourceTimeLine } from "./components/timeLine";
import {
  ResourceAllocationEmployeeProps,
  ResourceAllocationTimeLineProps,
  ResourceTeamAPIBodyProps,
  ResourceTimeLineDataProps,
} from "./types";
import AddResourceAllocations from "../components/addAllocation";
import { TableContextProvider } from "../store/tableContext";
import { TimeLineContext, TimeLineContextProvider } from "../store/timeLineContext";
import { getIsBillableValue } from "../utils/helper";

const ResourceTimeLineView = () => {
  return (
    <>
      <TableContextProvider>
        <TimeLineContextProvider>
          <ResourceTimeLineComponet />
        </TimeLineContextProvider>
      </TableContextProvider>
    </>
  );
};

const ResourceTimeLineComponet = () => {
  const { toast } = useToast();
  const {
    apiControler,
    employees,
    customer,
    allocations,
    filters,
    allocationData,
    updateApiControler,
    setEmployeesData,
    setCustomerData,
    setAllocationsData,
    isEmployeeExits,
    setAllocationData,
  } = useContext(TimeLineContext);

  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );
  const resourceAllocationForm: AllocationDataProps = useSelector((state: RootState) => state.resource_allocation_form);

  const { call: fetchData } = useFrappePostCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data"
  );

  const user = useSelector((state: RootState) => state.user);

  const getFilterApiBody = useCallback(
    (req: ResourceTeamAPIBodyProps): ResourceTeamAPIBodyProps => {
      let newReqBody: ResourceTeamAPIBodyProps = {
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
          skills: filters?.skillSearch && filters?.skillSearch?.length > 0 ? JSON.stringify(filters.skillSearch) : "[]",
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

  const handleDelete = useCallback(
    (oldData: AllocationDataProps, newData: AllocationDataProps) => {
      setAllocationData({
        old: oldData,
        new: newData,
        isNeedToDelete: true,
      });
    },
    [setAllocationData]
  );

  const filterApiData = useCallback(
    (data: ResourceTimeLineDataProps) => {
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
          title: allocation.name,
          start_time: getUTCDateTime(allocation.allocation_start_date).getTime(),
          end_time: getUTCDateTime(allocation.allocation_end_date).setDate(
            getUTCDateTime(allocation.allocation_end_date).getDate() + 1
          ),
          customerData: {
            ...updatedData.customer[allocation.customer],
          },
          canDelete: resourceAllocationPermission.delete,
          onDelete: handleDelete,
        })
      );

      return updatedData;
    },
    [handleDelete, resourceAllocationPermission.delete]
  );

  const loadIntialData = useCallback(async () => {
    const req: ResourceTeamAPIBodyProps = {
      date: filters.weekDate,
      start: filters.start,
    };

    const mainThredData = await handleApiCall(req);

    if (!mainThredData) return;

    const data = filterApiData(mainThredData);

    setEmployeesData(data.employees, mainThredData.has_more);
    setCustomerData(data.customer);
    setAllocationsData(data.resource_allocations);
  }, [
    filters.weekDate,
    filters.start,
    handleApiCall,
    filterApiData,
    setEmployeesData,
    setCustomerData,
    setAllocationsData,
  ]);

  const handleFormSubmit = useCallback(
    (
      oldData: ResourceAllocationTimeLineProps | undefined = undefined,
      newData: ResourceAllocationTimeLineProps | undefined = undefined
    ) => {
      if (!oldData || !newData) return;
      const employeeList = [];
      const isOldEmployeeExits = isEmployeeExits(oldData.employee);
      const isNewEmployeeExits = isEmployeeExits(newData.employee);

      if (isOldEmployeeExits) {
        employeeList.push(oldData.employee);
      }
      if (isNewEmployeeExits) {
        employeeList.push(newData.employee);
      }

      if (employeeList.length == 0) return;

      fetchData({
        date: filters.weekDate,
        employee_id: JSON.stringify(employeeList),
        is_billable: getIsBillableValue(filters.allocationType as string[]),
      }).then((res) => {
        if (res.message) {
          const updatedAllocations = allocations.filter(
            (allocation) => allocation.employee != oldData.employee && allocation.employee != newData.employee
          );
          const filterData = filterApiData(res.message);
          setAllocationsData([...updatedAllocations, ...filterData.resource_allocations], "Set");
          setCustomerData({ ...customer, ...filterData.customer });
        }
      });
    },
    [allocations, customer, fetchData, filterApiData, filters, isEmployeeExits, setAllocationsData, setCustomerData]
  );

  useEffect(() => {
    if (apiControler.isNeedToFetchDataAfterUpdate) {
      loadIntialData();
      updateApiControler({ isNeedToFetchDataAfterUpdate: false });
    }
  }, [loadIntialData, apiControler.isNeedToFetchDataAfterUpdate, updateApiControler]);

  useEffect(() => {
    if (allocationData.isNeedToDelete) {
      handleFormSubmit(allocationData.old, allocationData.new);
      setAllocationData({ isNeedToDelete: false });
    }
  }, [allocationData.isNeedToDelete, allocationData.new, allocationData.old, handleFormSubmit, setAllocationData]);

  useEffect(() => {
    // This way will make sure the timeline width changes when the user collapses the sidebar.
    setTimeout(() => {
      const container = document.querySelector<HTMLDivElement>(".react-calendar-timeline");
      const scrollContainer = document.querySelector<HTMLDivElement>(".rct-scroll");
      const sidebar = document.querySelector<HTMLDivElement>(".rct-sidebar");

      if (container && scrollContainer && sidebar) {
        scrollContainer.style.transition = "width 0.2s ease";
        scrollContainer.style.width = `${container.offsetWidth - sidebar.offsetWidth}px`;
      }
    }, 500);
  }, [user.isSidebarCollapsed]);

  return (
    <>
      <ResourceTimLineHeaderSection />
      {apiControler.isLoading && employees.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceTimeLine handleFormSubmit={handleFormSubmit} />
      )}

      {resourceAllocationForm.isShowDialog && <AddResourceAllocations onSubmit={handleFormSubmit} />}
    </>
  );
};

export default ResourceTimeLineView;
