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
import { updateData, setReFetchData, setData } from "@/store/resource_management/team";

import { getIsBillableValue } from "../utils/helper";
import { ResourceTeamTable } from "./components/Table";
import AddResourceAllocations from "../components/AddAllocation";
import { usePagination } from "../hooks/usePagination";
import { ResourceTeamHeaderSection } from "./components/Header";

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

  const getKey = (pageIndex: number, previousPageData: any) => {
    const indexTillNeedToFetchData = resourceTeamState.start / resourceTeamState.pageLength + 1;
    if (indexTillNeedToFetchData <= pageIndex) return null;
    if (previousPageData && !previousPageData.message.has_more) return null;
    return `next_pms.resource_management.api.team.get_resource_management_team_view_data/get_resource_management_team_view_data?page=${pageIndex}&limit=${resourceTeamState.pageLength}`;
  };

  const { data, isLoading, isValidating, error, size, setSize, mutate } = usePagination(
    "next_pms.resource_management.api.team.get_resource_management_team_view_data",
    getKey,
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
        }
      : {
          date: resourceTeamState.weekDate,
          max_week: resourceTeamState.maxWeek,
          page_length: resourceTeamState.pageLength,
          employee_name: resourceTeamState.employeeName,
        },
    {
      revalidateFirstPage: false,
      revalidateAll: false,
    }
  );

  const onFormSubmit = useCallback(() => {
    dispatch(setReFetchData(true));
  }, [dispatch]);

  useEffect(() => {
    if (resourceTeamState.isNeedToFetchDataAfterUpdate) {
      if (resourceTeamState.isNeedToFetchAllData) {
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
    resourceTeamState.isNeedToFetchAllData,
    resourceTeamState.isNeedToFetchDataAfterUpdate,
    size,
  ]);

  useEffect(() => {
    if (data && data.length > 0) {
      if (resourceTeamState.isNeedToFetchAllData) {
        dispatch(setData(data[0].message));
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
    if (!resourceTeamState) return;
    const newSize: number = resourceTeamState.start / resourceTeamState.pageLength + 1;
    if (newSize == size) {
      return;
    }
    setSize(newSize);
  }, [resourceTeamState, resourceTeamState.start, setSize, size]);

  return (
    <>
      <ResourceTeamHeaderSection />
      {(isLoading || isValidating) && resourceTeamState.data.data.length == 0 ? (
        <Spinner isFull />
      ) : (
        <ResourceTeamTable />
      )}
      {resourceAllocationForm.isShowDialog && <AddResourceAllocations onSubmit={onFormSubmit} />}
    </>
  );
};

export default ResourceTeamView;
