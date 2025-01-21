/**
 * External dependencies.
 */
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Spinner,useToast } from "@next-pms/design-system/components";
import { useFrappeGetCall, useFrappePostCall } from "frappe-react-sdk";
/**
 * Internal dependencies.
 */
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { AllocationDataProps, PermissionProps } from "@/store/resource_management/allocation";
import { setData, setReFetchData, updateData } from "@/store/resource_management/project";

import AddResourceAllocations from "../components/AddAllocation";
import { getIsBillableValue } from "../utils/helper";
import { ResourceProjectHeaderSection } from "./components/Header";
import { ResourceProjectTable } from "./components/Table";
import { getNextDate } from "../utils/dates";

/**
 * This is main component which is responsible for rendering the project view of resource management.
 *
 * @returns React.FC
 */
const ResourceTeamView = () => {
  const { toast } = useToast();
  const resourceProjectState = useSelector((state: RootState) => state.resource_project);
  const ResourceAllocationForm: AllocationDataProps = useSelector((state: RootState) => state.resource_allocation_form);
  const resourceAllocationPermission: PermissionProps = useSelector(
    (state: RootState) => state.resource_allocation_form.permissions
  );
  const dispatch = useDispatch();

  const { call: fetchSingleRecord } = useFrappePostCall(
    "next_pms.resource_management.api.project.get_resource_management_project_view_data"
  );

  const { data, isLoading, isValidating, error, mutate } = useFrappeGetCall(
    "next_pms.resource_management.api.project.get_resource_management_project_view_data",
    resourceAllocationPermission.write
      ? {
          date: resourceProjectState.weekDate,
          max_week: resourceProjectState.maxWeek,
          page_length: resourceProjectState.pageLength,
          project_name: resourceProjectState.projectName,
          customer: resourceProjectState.customer,
          billing_type: resourceProjectState.billingType,
          is_billable: getIsBillableValue(resourceProjectState.allocationType as string[]),
          start: resourceProjectState.start,
        }
      : {
          date: resourceProjectState.weekDate,
          max_week: resourceProjectState.maxWeek,
          page_length: resourceProjectState.pageLength,
          project_name: resourceProjectState.projectName,
          start: resourceProjectState.start,
        },
    "next_pms.resource_management.api.project.get_resource_management_project_view_data_resource_project_page",
    { revalidateOnFocus: false, revalidateOnReconnect: false, revalidateIfStale: false, revalidateOnMount: false }
  );

  const onFormSubmit = useCallback(
    (oldData: AllocationDataProps, newData: AllocationDataProps) => {
      fetchSingleRecord({
        date: resourceProjectState.weekDate,
        max_week: resourceProjectState.maxWeek,
        project_id: JSON.stringify([oldData.project, newData.project]),
        is_billable: getIsBillableValue(resourceProjectState.allocationType as string[]),
      }).then((res) => {
        const newProject = res.message?.data;
        if (newProject && newProject.length > 0) {
          const updatedData = resourceProjectState.data.data.map((item) => {
            const index = newProject.findIndex((project) => project.name == item.name);
            if (index != -1) {
              return newProject[index];
            }
            return item;
          });
          dispatch(setData({ ...resourceProjectState.data, data: updatedData }));
        }
      });
    },
    [
      dispatch,
      fetchSingleRecord,
      resourceProjectState.allocationType,
      resourceProjectState.data,
      resourceProjectState.maxWeek,
      resourceProjectState.weekDate,
    ]
  );

  useEffect(() => {
    if (resourceProjectState.isNeedToFetchDataAfterUpdate) {
      mutate();
      dispatch(setReFetchData(false));
    }
  }, [data, dispatch, mutate, resourceProjectState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    if (data) {
      if (resourceProjectState.action == "SET") {
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
      <ResourceProjectHeaderSection />

      {(isLoading || isValidating) && resourceProjectState.data.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceProjectTable
          dateToAddHeaderRef={getNextDate(resourceProjectState.weekDate, resourceProjectState.maxWeek - 1)}
          onSubmit={onFormSubmit}
        />
      )}

      {ResourceAllocationForm.isShowDialog && <AddResourceAllocations onSubmit={onFormSubmit} />}
    </>
  );
};

export default ResourceTeamView;
