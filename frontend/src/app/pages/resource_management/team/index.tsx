/**
 * External dependencies.
 */
import { useCallback, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * Internal dependencies.
 */
import { Spinner } from "@/app/components/spinner";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { AllocationDataProps, PermissionProps } from "@/store/resource_management/allocation";
import { updateData, setReFetchData, setData } from "@/store/resource_management/team";

import { getIsBillableValue } from "../utils/helper";
import { ResourceTeamTable } from "./components/Table";
import AddResourceAllocations from "../components/AddAllocation";
import { usePagination } from "../hooks/usePagination";
import { ResourceTeamHeaderSection } from "./components/Header";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";

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

  const { call: fetchSingleRecord } = useFrappePostCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data"
  );

  const { data, isLoading, isValidating, error, mutate } = useFrappeGetCall(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data",
    resourceAllocationPermission.write
      ? {
          date: resourceTeamState.weekDate,
          max_week: resourceTeamState.maxWeek,
          page_length: resourceTeamState.pageLength,
          employee_name: resourceTeamState.employeeName,
          business_unit: resourceTeamState.businessUnit,
          reports_to: resourceTeamState.reportingManager,
          designation: resourceTeamState.designation,
          is_billable: getIsBillableValue(resourceTeamState.allocationType as string[]),
          skills: resourceTeamState?.skillSearch?.length > 0 ? resourceTeamState.skillSearch : null,
          start: resourceTeamState.start,
        }
      : {
          date: resourceTeamState.weekDate,
          max_week: resourceTeamState.maxWeek,
          page_length: resourceTeamState.pageLength,
          employee_name: resourceTeamState.employeeName,
          start: resourceTeamState.start,
        },
    "next_pms.resource_management.api.team.get_resource_management_team_view_data_resource_team_page",
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      revalidateIfStale: false,
      revalidateOnMount: false,
    }
  );

  const onFormSubmit = useCallback(
    (oldData: AllocationDataProps, newData: AllocationDataProps) => {
      fetchSingleRecord({
        date: resourceTeamState.weekDate,
        max_week: resourceTeamState.maxWeek,
        employee_id: JSON.stringify([oldData.employee, newData.employee]),
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
          dispatch(setData({ ...resourceTeamState.data, data: updatedData }));
        }
      });
    },
    [dispatch, fetchSingleRecord, resourceTeamState]
  );

  useEffect(() => {
    if (resourceTeamState.isNeedToFetchDataAfterUpdate) {
      mutate();
      dispatch(setReFetchData(false));
    }
  }, [data, dispatch, mutate, resourceTeamState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    if (data) {
      if (resourceTeamState.action === "SET") {
        dispatch(setData(data.message));
      } else {
        dispatch(updateData(data.message));
      }
    }
    if (error) {
      const err = parseFrappeErrorMsg(error);
      toast({
        variant: "destructive",
        description: err,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, error]);

  return (
    <>
      <ResourceTeamHeaderSection />
      {(isLoading || isValidating) && resourceTeamState.data.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceTeamTable onSubmit={onFormSubmit} />
      )}
      {resourceAllocationForm.isShowDialog && <AddResourceAllocations onSubmit={onFormSubmit} />}
    </>
  );
};

export default ResourceTeamView;
