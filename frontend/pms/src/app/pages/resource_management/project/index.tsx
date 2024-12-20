/**
 * External dependencies.
 */
import { useCallback, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

/**
 * Internal dependencies.
 */
import { Spinner } from "@/app/components/spinner";
import { useToast } from "@/app/components/ui/use-toast";
import { parseFrappeErrorMsg } from "@/lib/utils";
import { RootState } from "@/store";
import { AllocationDataProps, PermissionProps } from "@/store/resource_management/allocation";
import { setData, setReFetchData } from "@/store/resource_management/project";

import AddResourceAllocations from "../components/AddAllocation";
import { getIsBillableValue } from "../utils/helper";
import { ResourceProjectTable } from "./components/Table";
import { useFrappeGetCallInfinite } from "../hooks/useFrappeGetCallInfinite";
import { getMergeData } from "../utils/value";

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

  const getKey = (pageIndex: number, previousPageData: any) => {
    const indexTillNeedToFetchData = resourceProjectState.start / resourceProjectState.pageLength + 1;
    if (indexTillNeedToFetchData <= pageIndex) return null;
    if (previousPageData && !previousPageData.message.has_more) return null;
    return `next_pms.resource_management.api.team.get_resource_management_team_view_data/get_resource_management_team_view_data?page=${pageIndex}&limit=${resourceProjectState.pageLength}`;
  };

  const { data, isLoading, isValidating, error, size, setSize, mutate } = useFrappeGetCallInfinite(
    "next_pms.resource_management.api.project.get_resource_management_project_view_data",
    getKey,
    resourceAllocationPermission.write
      ? {
          date: resourceProjectState.weekDate,
          max_week: 3,
          page_length: resourceProjectState.pageLength,
          project_name: resourceProjectState.projectName,
          customer: resourceProjectState.customer,
          is_billable: getIsBillableValue(resourceProjectState.allocationType as string[]),
        }
      : {
          date: resourceProjectState.weekDate,
          max_week: 3,
          page_length: resourceProjectState.pageLength,
          project_name: resourceProjectState.projectName,
        },
    { parallel: true }
  );

  const onFormSubmit = useCallback(() => {
    dispatch(setReFetchData(true));
  }, [dispatch]);

  useEffect(() => {
    if (resourceProjectState.isNeedToFetchDataAfterUpdate) {
      mutate();
      dispatch(setReFetchData(false));
    }
  }, [dispatch, mutate, resourceProjectState.isNeedToFetchDataAfterUpdate]);

  useEffect(() => {
    if (data) {
      const mergeData = getMergeData(data);
      dispatch(setData(mergeData));
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



  useEffect(() => {
    if (!resourceProjectState) return;
    setSize((resourceProjectState.start + resourceProjectState.pageLength) / resourceProjectState.pageLength + 1);
  }, [resourceProjectState, resourceProjectState.start, setSize]);

  return (
    <>
      {(isLoading || isValidating) && resourceProjectState.data.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceProjectTable />
      )}

      {ResourceAllocationForm.isShowDialog && <AddResourceAllocations onSubmit={onFormSubmit} />}
    </>
  );
};

export default ResourceTeamView;
