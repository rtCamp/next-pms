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
import { AllocationDataProps, PermissionProps, setResourcePermissions } from "@/store/resource_management/allocation";
import { setData, setReFetchData, updateData } from "@/store/resource_management/project";

import AddResourceAllocations from "../components/AddAllocation";
import { getIsBillableValue } from "../utils/helper";
import { ResourceProjectTable } from "./components/Table";
import { usePagination } from "../hooks/usePagination";
import { ResourceProjectHeaderSection } from "./components/Header";

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
    return `next_pms.resource_management.api.project.get_resource_management_project_view_data?page=${pageIndex}&limit=${resourceProjectState.pageLength}`;
  };

  const { data, isLoading, isValidating, error, size, setSize, mutate } = usePagination(
    "next_pms.resource_management.api.project.get_resource_management_project_view_data",
    getKey,
    resourceAllocationPermission.write
      ? {
          date: resourceProjectState.weekDate,
          max_week: resourceProjectState.maxWeek,
          page_length: resourceProjectState.pageLength,
          project_name: resourceProjectState.projectName,
          customer: resourceProjectState.customer,
          is_billable: getIsBillableValue(resourceProjectState.allocationType as string[]),
        }
      : {
          date: resourceProjectState.weekDate,
          max_week: resourceProjectState.maxWeek,
          page_length: resourceProjectState.pageLength,
          project_name: resourceProjectState.projectName,
        },
    { revalidateFirstPage: false, revalidateAll: false }
  );

  const onFormSubmit = useCallback(() => {
    dispatch(setReFetchData(true));
  }, [dispatch]);

  useEffect(() => {
    if (resourceProjectState.isNeedToFetchDataAfterUpdate) {
      if (resourceProjectState.isNeedToFetchAllData) {
        mutate();
        dispatch(setReFetchData(false));
        return;
      }
      if (!data) {
        mutate();
      } else {
        mutate(data, {
          // only revalidate the last page
          revalidate: (pageData, [url, page]) => page === size,
        });
      }
      dispatch(setReFetchData(false));
    }
  }, [
    data,
    dispatch,
    mutate,
    resourceProjectState.isNeedToFetchAllData,
    resourceProjectState.isNeedToFetchDataAfterUpdate,
    size,
  ]);

  useEffect(() => {
    if (data && data.length > 0) {
      if (resourceProjectState.isNeedToFetchAllData) {
        dispatch(setData(data[0].message));
        dispatch(setResourcePermissions(data[0].message.permissions));
      } else {
        dispatch(updateData(data[data.length - 1].message));
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

  useEffect(() => {
    if (!resourceProjectState) return;
    const newSize: number = resourceProjectState.start / resourceProjectState.pageLength + 1;
    if (newSize == size) {
      return;
    }
    setSize(newSize);
  }, [resourceProjectState, resourceProjectState.start, setSize, size]);

  return (
    <>
      <ResourceProjectHeaderSection />

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
